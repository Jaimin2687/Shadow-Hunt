'use client';
import { useState } from 'react';
import { Alert, UserRiskState } from '@/types/events';
import { api } from '@/lib/api';
import { BellRing, AlertTriangle, Info, Shield, Key, Flag, Lock, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

const SEVERITY_ICONS: Record<string, typeof AlertTriangle> = {
  CRITICAL: AlertTriangle,
  HIGH: AlertTriangle,
  MEDIUM: BellRing,
  LOW: Info,
};

// Sleek UN-RED cyberpunk neon aesthetics with rich cyan, amber, sapphire and emerald highlights
const SEVERITY_STYLES: Record<string, { card: string; text: string; badge: string; glow: string }> = {
  CRITICAL: {
    card: 'bg-[#09152e]/95 border-[#00e5ff]/50 text-[#e6f7ff] shadow-[0_0_18px_rgba(0,229,255,0.2)] hover:border-[#00ff88]/60 hover:bg-[#0c1e40]',
    text: 'text-[#00e5ff]',
    badge: 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/40',
    glow: 'shadow-[0_0_12px_rgba(0,229,255,0.4)]',
  },
  HIGH: {
    card: 'bg-[#0d182e]/95 border-[#ffb300]/50 text-[#fff7e6] shadow-[0_0_15px_rgba(255,179,0,0.18)] hover:border-[#ffb300]/80 hover:bg-[#11203d]',
    text: 'text-[#ffb300]',
    badge: 'bg-[#ffb300]/20 text-[#ffb300] border-[#ffb300]/40',
    glow: 'shadow-[0_0_12px_rgba(255,179,0,0.4)]',
  },
  MEDIUM: {
    card: 'bg-[#0a1830]/95 border-[#00ff88]/40 text-[#e6fff5] hover:border-[#00ff88]/70 hover:bg-[#0d2140]',
    text: 'text-[#00ff88]',
    badge: 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/40',
    glow: 'shadow-[0_0_12px_rgba(0,255,136,0.3)]',
  },
  LOW: {
    card: 'bg-[#071428]/95 border-[#3388ff]/40 text-[#e6f0ff] hover:border-[#3388ff]/70 hover:bg-[#0a1b38]',
    text: 'text-[#3388ff]',
    badge: 'bg-[#3388ff]/20 text-[#3388ff] border-[#3388ff]/40',
    glow: 'shadow-[0_0_12px_rgba(51,136,255,0.3)]',
  },
};

interface AlertsBannerProps {
  alerts: Alert[];
  riskUpdates: Record<string, UserRiskState>;
  onSelectUser: (user: UserRiskState) => void;
}

export function AlertsBanner({ alerts, riskUpdates, onSelectUser }: AlertsBannerProps) {
  const [loadingAlertId, setLoadingAlertId] = useState<string | null>(null);
  const [executedAlertIds, setExecutedAlertIds] = useState<Record<string, string>>({});

  if (alerts.length === 0) return null;

  const recent = alerts.slice(0, 4);

  const handleRowClick = (alertMsg: string) => {
    // Extract username (usually first word before space or department parenthesis)
    const usernameMatch = alertMsg.match(/^([a-zA-Z0-9._-]+)/);
    const username = usernameMatch ? usernameMatch[1] : null;
    if (!username) return;

    // Search riskUpdates for matching username or user_id
    const target = Object.values(riskUpdates).find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.user_id.toLowerCase() === username.toLowerCase()
    );

    if (target) {
      onSelectUser(target);
    } else {
      // Fallback display if user telemetry just initialized
      onSelectUser({
        user_id: username,
        username: username,
        department: alertMsg.includes('(HR)') ? 'HR' : alertMsg.includes('(Finance)') ? 'Finance' : 'Engineering',
        role: 'Monitored Actor',
        current_risk: 85.0,
        peak_risk: 100.0,
        risk_history: [85.0],
        anomaly_count: 1,
        last_event_time: Date.now(),
        is_isolated: false,
        active_alerts: [],
      });
    }
  };

  const handleExecuteSoar = async (e: React.MouseEvent, alertId: string, alertMsg: string) => {
    e.stopPropagation();
    if (loadingAlertId || executedAlertIds[alertId]) return;

    // Detect action from message
    let action = 'ISOLATE_ACCOUNT';
    if (alertMsg.includes('REVOKE_SESSION')) action = 'REVOKE_SESSION';
    if (alertMsg.includes('FLAG_AUDIT')) action = 'FLAG_AUDIT';
    if (alertMsg.includes('STEP_UP_AUTH')) action = 'STEP_UP_AUTH';

    const usernameMatch = alertMsg.match(/^([a-zA-Z0-9._-]+)/);
    const targetUser = usernameMatch ? usernameMatch[1] : 'eng_01';

    setLoadingAlertId(alertId);
    try {
      await api.executeAction(action, targetUser, 'Auto-remediation executed from interactive Alert Banner');
      setExecutedAlertIds((prev) => ({ ...prev, [alertId]: action }));
    } catch (err) {
      console.error('Failed to execute SOAR from alert:', err);
    } finally {
      setLoadingAlertId(null);
    }
  };

  const getActionConfig = (msg: string) => {
    if (msg.includes('REVOKE_SESSION')) return { name: 'REVOKE SESSION', icon: Key, color: 'border-[#ffaa00]/60 text-[#ffb300] bg-[#ffb300]/10 hover:bg-[#ffb300]/20' };
    if (msg.includes('FLAG_AUDIT')) return { name: 'FLAG FOR AUDIT', icon: Flag, color: 'border-[#00e5ff]/60 text-[#00e5ff] bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20' };
    if (msg.includes('STEP_UP_AUTH')) return { name: 'STEP-UP AUTH', icon: Lock, color: 'border-[#3388ff]/60 text-[#3388ff] bg-[#3388ff]/10 hover:bg-[#3388ff]/20' };
    return { name: 'ISOLATE ACCOUNT', icon: Shield, color: 'border-[#00ff88]/60 text-[#00ff88] bg-[#00ff88]/10 hover:bg-[#00ff88]/20' };
  };

  return (
    <div className="flex flex-col gap-2 shrink-0 max-h-48 overflow-y-auto pr-1">
      {recent.map((alert, idx) => {
        const Icon = SEVERITY_ICONS[alert.severity] || Info;
        const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.LOW;
        const actionConfig = getActionConfig(alert.message);
        const ActionIcon = actionConfig.icon;
        const isExecuting = loadingAlertId === alert.id;
        const executedAction = executedAlertIds[alert.id];

        return (
          <div
            key={alert.id}
            onClick={() => handleRowClick(alert.message)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer group ${style.card}`}
            style={{ animationDelay: `${idx * 50}ms` }}
            title="Click row to open User Deep Dive & Risk Vectors"
          >
            {/* Severity Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${style.badge} ${style.glow}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{alert.severity}</span>
            </div>

            {/* Alert Content */}
            <span className="text-sm flex-1 font-semibold tracking-wide truncate group-hover:text-white transition-colors">
              {alert.message}
            </span>

            {/* Scenario Tag */}
            {alert.scenario_id && (
              <span className="text-[11px] font-mono font-bold bg-[#00e5ff]/15 text-[#00e5ff] px-2.5 py-0.5 rounded-full border border-[#00e5ff]/30">
                {alert.scenario_id}
              </span>
            )}

            {/* Interactive SOAR Execution Button directly on Alert */}
            <button
              onClick={(e) => handleExecuteSoar(e, alert.id, alert.message)}
              disabled={!!isExecuting || !!executedAction}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs transition-all duration-200 shadow-md ${
                executedAction
                  ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                  : actionConfig.color
              }`}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>EXECUTING...</span>
                </>
              ) : executedAction ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span>✓ EXECUTED ({executedAction})</span>
                </>
              ) : (
                <>
                  <ActionIcon className="w-3.5 h-3.5" />
                  <span>⚡ EXECUTE {actionConfig.name}</span>
                </>
              )}
            </button>

            {/* Inspect Arrow */}
            <div className="flex items-center gap-1 text-[#7a8ba8] group-hover:text-[#00e5ff] transition-colors text-xs font-mono pl-1 border-l border-white/10">
              <span>INSPECT</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
