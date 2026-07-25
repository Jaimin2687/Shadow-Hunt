import { config } from '../config.js';
import { TelemetryEvent, AnomalyResponse } from '../types/events.js';

const TIMEOUT_MS = 5000;
const RETRY_DELAY_MS = 500;

export class EngineClient {
  private failCount = 0;

  async scoreEvent(event: TelemetryEvent): Promise<AnomalyResponse> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(`${config.ENGINE_URL}/api/v1/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[EngineClient] Engine ${res.status}: ${errorText.slice(0, 200)}`);
          throw new Error(`Engine HTTP ${res.status}`);
        }

        const data = await res.json() as AnomalyResponse;
        this.failCount = 0;
        return data;
      } catch (err: any) {
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        this.failCount++;
        if (this.failCount % 100 === 1) {
          console.error(`[EngineClient] ${this.failCount} consecutive failures:`, err?.message);
        }
      }
    }

    // Fallback: return safe zero-risk response
    return {
      user_id: event.actor.user_id,
      risk_score: 0,
      is_anomaly: false,
      severity: 'INFORMATIONAL',
      breakdown: {
        novelty_score: 0, temporal_anomaly: 0,
        volume_max_z: 0, pyod_percentile: 0, peer_deviation: 0
      },
      recommended_action: 'MONITOR'
    };
  }
}
