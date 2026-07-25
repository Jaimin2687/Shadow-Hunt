'use client';
import { useState } from 'react';
import { Alert, UserRiskState } from '@/types/events';
import { api } from '@/lib/api';
import { BellRing, AlertTriangle, Info, Shield, Key, Flag, Lock, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { GlassPanel, Badge } from './ui/primitives';
import { motion } from 'framer-motion';

const SEVERITY_ICONS: Record<string, typeof AlertTriangle> = {
  CRITICAL: AlertTriangle,
  HIGH: AlertTriangle,
  MEDIUM: BellRing,
  LOW: Info,
};

const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return 'crimson';
    case 'HIGH': return 'amber';
    case 'MEDIUM': return 'emerald';
    default: return 'cyan';
  }
};

const getSeverityBorderColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return '#ff3366';
    case 'HIGH': return '#ffaa00';
    case 'MEDIUM': return '#00ff88';
    default: return '#00e5ff';
  }
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
        is_session_revoked: false,
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
    if (msg.includes('REVOKE_SESSION')) return { name: 'REVOKE SESSION', icon: Key, color: 'border-[#ffaa00]/60 text-[#ffb300] bg-[#ffb300]/10 hover:bg-[#ffb300]/20 hover:shadow-[0_0_10px_rgba(255,170,0,0.3)]' };
    if (msg.includes('FLAG_AUDIT')) return { name: 'FLAG FOR AUDIT', icon: Flag, color: 'border-[#00e5ff]/60 text-[#00e5ff] bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)]' };
    if (msg.includes('STEP_UP_AUTH')) return { name: 'STEP-UP AUTH', icon: Lock, color: 'border-[#3388ff]/60 text-[#3388ff] bg-[#3388ff]/10 hover:bg-[#3388ff]/20 hover:shadow-[0_0_10px_rgba(51,136,255,0.3)]' };
    return { name: 'ISOLATE ACCOUNT', icon: Shield, color: 'border-[#00ff88]/60 text-[#00ff88] bg-[#00ff88]/10 hover:bg-[#00ff88]/20 hover:shadow-[0_0_10px_rgba(0,255,136,0.3)]' };
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto mt-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
      {alerts.map((alert, idx) => {
        const Icon = SEVERITY_ICONS[alert.severity] || Info;
        const actionConfig = getActionConfig(alert.message);
        const ActionIcon = actionConfig.icon;
        const isExecuting = loadingAlertId === alert.id;
        const executedAction = executedAlertIds[alert.id];
        const borderColor = getSeverityBorderColor(alert.severity);

        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleRowClick(alert.message)}
            title="Click row to open User Deep Dive & Risk Vectors"
            className="cursor-pointer group"
          >
            <GlassPanel 
              className="p-3 flex items-center justify-between border-l-4 hover:bg-white/5 transition-colors"
              style={{ borderLeftColor: borderColor }}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1 pr-4">
                {/* Severity Badge */}
                <Badge variant={getSeverityVariant(alert.severity) as any}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{alert.severity}</span>
                </Badge>

                {/* Alert Content */}
                <span className="text-sm font-semibold tracking-wide truncate group-hover:text-white transition-colors text-gray-300">
                  {alert.message}
                </span>

                {/* Scenario Tag */}
                {alert.scenario_id && (
                  <span className="text-[11px] font-mono font-bold bg-[#00e5ff]/15 text-[#00e5ff] px-2.5 py-0.5 rounded-full border border-[#00e5ff]/30 shrink-0">
                    {alert.scenario_id}
                  </span>
                )}
              </div>

              {/* Actions & Inspect Arrow */}
              <div className="flex items-center gap-3 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e: any) => handleExecuteSoar(e, alert.id, alert.message)}
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
                </motion.button>

                <div className="flex items-center gap-1 text-[#7a8ba8] group-hover:text-[#00e5ff] transition-colors text-xs font-mono pl-1 border-l border-white/10">
                  <span>INSPECT</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        );
      })}
    </div>
  );
}
