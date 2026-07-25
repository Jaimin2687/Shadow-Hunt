import { TelemetryEvent, AnomalyResponse, UserRiskState, Alert, SoarAction } from '../types/events.js';
import { randomUUID } from 'crypto';

export class RiskAccumulator {
  private userStates: Map<string, UserRiskState> = new Map();
  private readonly DECAY_LAMBDA: number = Math.LN2 / 24; // 24h half-life
  private static readonly MAX_USERS = 500;
  private static readonly EVICTION_TTL_MS = 24 * 60 * 60 * 1000;

  private evictStaleUsers(): void {
    if (this.userStates.size >= RiskAccumulator.MAX_USERS) {
      const now = Date.now();
      const sorted = [...this.userStates.entries()].sort((a, b) => a[1].last_event_time - b[1].last_event_time);
      for (const [id, state] of sorted) {
        if (this.userStates.size <= RiskAccumulator.MAX_USERS * 0.8) break;
        if (now - state.last_event_time > RiskAccumulator.EVICTION_TTL_MS || this.userStates.size >= RiskAccumulator.MAX_USERS) {
          this.userStates.delete(id);
        }
      }
    }
  }


  private getOrCreateUser(event: TelemetryEvent): UserRiskState {
    const userId = event.actor.user_id;
    let state = this.userStates.get(userId);
    if (!state) {
      state = {
        user_id: userId,
        username: event.actor.username,
        department: event.actor.department,
        role: event.actor.role,
        current_risk: 0,
        peak_risk: 0,
        risk_history: [],
        anomaly_count: 0,
        last_event_time: Date.now(),
        is_isolated: false,
        active_alerts: []
      };
      this.evictStaleUsers();
      this.userStates.set(userId, state);
    }
    return state;
  }

  updateRisk(event: TelemetryEvent, anomalyResponse: AnomalyResponse): { userState: UserRiskState; newAlerts: Alert[] } {
    const state = this.getOrCreateUser(event);
    const now = new Date(event.timestamp).getTime();
    if (isNaN(now)) return { userState: state, newAlerts: [] };
    
    // Time delta in hours since last event
    const deltaHours = Math.max(0, (now - state.last_event_time) / 3_600_000);
    
    // Decay existing risk (24h half-life exponential decay)
    const decayedRisk = state.current_risk * Math.exp(-this.DECAY_LAMBDA * deltaHours);
    
    // Engine's risk_score is the instantaneous anomaly signal (0-100).
    // Use EWMA tracking: blend decayed risk with new engine score.
    // - For high anomaly scores (attacks): rapidly pull risk UP
    // - For low scores (normal): gently pull risk DOWN
    const engineScore = anomalyResponse.risk_score ?? 0;
    
    let newRisk: number;
    if (engineScore >= 60) {
      // Attack signal: take the MAX of decayed and engine score (spike immediately)
      newRisk = Math.max(decayedRisk, engineScore);
    } else if (engineScore >= 30) {
      // Medium signal: blend with heavy weight on new score
      const alpha = 0.6;  // 60% new, 40% old
      newRisk = alpha * engineScore + (1 - alpha) * decayedRisk;
    } else {
      // Normal signal: slowly track downward, letting decay do the work
      const alpha = 0.15; // 15% new, 85% decayed old
      newRisk = alpha * engineScore + (1 - alpha) * decayedRisk;
    }
    
    newRisk = Math.min(100, Math.max(0, newRisk));
    if (!Number.isFinite(newRisk)) newRisk = 0;

    const previousRisk = state.current_risk;
    state.current_risk = newRisk;
    state.peak_risk = Math.max(state.peak_risk, newRisk);
    
    state.risk_history.push(Math.round(newRisk * 100) / 100);
    if (state.risk_history.length > 100) state.risk_history.shift();

    if (anomalyResponse.is_anomaly) {
      state.anomaly_count += 1;
    }
    state.last_event_time = now;

    // Alert generation: emit when crossing thresholds UPWARD
    const newAlerts: Alert[] = [];
    const thresholds: Array<{ level: number; severity: string }> = [
      { level: 85, severity: 'CRITICAL' },
      { level: 70, severity: 'HIGH' },
      { level: 50, severity: 'MEDIUM' },
      { level: 30, severity: 'LOW' },
    ];

    for (const { level, severity } of thresholds) {
      if (newRisk >= level && previousRisk < level) {
        const scenarioTag = event.ground_truth?.scenario_id
          ? ` [Scenario: ${event.ground_truth.scenario_id}]`
          : '';
        const alert: Alert = {
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          severity,
          message: `${state.username} (${state.department}) risk crossed ${level}: ${newRisk.toFixed(1)} — ${anomalyResponse.recommended_action}${scenarioTag}`,
          scenario_id: event.ground_truth?.scenario_id ?? undefined,
          acknowledged: false
        };
        state.active_alerts.push(alert);
        // Keep only last 20 alerts per user
        if (state.active_alerts.length > 20) {
          state.active_alerts = state.active_alerts.slice(-20);
        }
        newAlerts.push(alert);
        break; // Only emit highest threshold crossed
      }
    }

    return { userState: state, newAlerts };
  }

  getTopRiskyUsers(n: number): UserRiskState[] {
    return Array.from(this.userStates.values())
      .sort((a, b) => b.current_risk - a.current_risk)
      .slice(0, n);
  }

  getAllUsers(): UserRiskState[] {
    return Array.from(this.userStates.values());
  }

  getUser(userId: string): UserRiskState | undefined {
    return this.userStates.get(userId);
  }

  applyAction(userId: string, action: SoarAction): UserRiskState | undefined {
    let state = this.userStates.get(userId);
    if (!state) {
      // Fallback: match by username if userId was passed as username (e.g. 'david.miller', 'sarah.jenkins')
      for (const val of this.userStates.values()) {
        if (val.username.toLowerCase() === userId.toLowerCase() || val.user_id === userId) {
          state = val;
          break;
        }
      }
    }
    if (!state) return undefined;

    if (action.action === 'ISOLATE_ACCOUNT' && state.is_isolated) {
      return state;
    }

    const recentDup = state.active_alerts.find(a => 
      a.message.includes(action.action) && 
      (Date.now() - new Date(a.timestamp).getTime()) < 30000
    );
    if (recentDup) {
      return state;
    }

    switch (action.action) {
      case 'ISOLATE_ACCOUNT':
        state.is_isolated = true;
        state.active_alerts.push({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
          message: `Account ISOLATED${action.analyst_note ? ': ' + action.analyst_note : ''}`,
          acknowledged: false
        });
        break;
      case 'REVOKE_SESSION':
      case 'FLAG_AUDIT':
      case 'STEP_UP_AUTH':
        state.active_alerts.push({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          severity: 'INFO',
          message: `SOAR: ${action.action}${action.analyst_note ? ' — ' + action.analyst_note : ''}`,
          acknowledged: false
        });
        break;
    }
    return state;
  }
}
