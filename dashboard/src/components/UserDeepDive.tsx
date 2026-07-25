'use client';
import { UserRiskState } from '@/types/events';
import { X, ShieldAlert, Activity, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { SoarActions } from './SoarActions';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, IconContainer, GlassPanel } from './ui/primitives';
import { cn } from '@/lib/utils';

export function UserDeepDive({ user, onClose }: { user: UserRiskState, onClose: () => void }) {
  // Mock data for radar based on risk score for visualization
  const factor = user.current_risk / 100;
  const radarData = [
    { subject: 'Novelty', A: 0.2 + factor * 0.7, fullMark: 1 },
    { subject: 'Temporal', A: 0.1 + factor * 0.8, fullMark: 1 },
    { subject: 'Volume', A: 0.3 + factor * 0.6, fullMark: 1 },
    { subject: 'ML Score', A: factor, fullMark: 1 },
    { subject: 'Peer Dev', A: 0.2 + factor * 0.5, fullMark: 1 },
  ];

  const historyData = user.risk_history.map((r, i) => ({ time: i, risk: r }));

  const getRiskColor = (risk: number) => {
    if (risk > 70) return '#ff3366';
    if (risk > 30) return '#ffaa00';
    return '#00ff88';
  };

  const riskColor = getRiskColor(user.current_risk);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0a0a0a]/95 backdrop-blur-xl rounded-2xl border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative"
        >
          {/* Accent Line */}
          <div 
            className="absolute top-0 left-0 w-full h-[2px]" 
            style={{ background: `linear-gradient(90deg, ${riskColor}, transparent)` }} 
          />

          {/* Header */}
          <div className="p-6 border-b border-[#222] flex items-start justify-between relative bg-black/40">
            <div className="flex gap-6 items-center z-10">
              <div 
                className="w-20 h-20 rounded-xl bg-black border border-[#222] flex items-center justify-center shadow-lg relative overflow-hidden"
              >
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ background: `radial-gradient(circle at center, ${riskColor} 0%, transparent 70%)` }} 
                />
                <span 
                  className="text-4xl font-mono font-bold z-10" 
                  style={{ color: riskColor, textShadow: `0 0 20px ${riskColor}60` }}
                >
                  {user.current_risk.toFixed(0)}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
                  {user.username}
                  {user.is_isolated && (
                    <Badge variant="crimson" className="animate-riskPulse">Isolated</Badge>
                  )}
                  {user.is_session_revoked && (
                    <Badge variant="amber">Session Revoked</Badge>
                  )}
                </h2>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#888]">
                  <span className="text-white">{user.role}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-[#222]">{user.department}</span>
                </div>
              </div>
            </div>
            
            <IconContainer onClick={onClose} className="cursor-pointer z-10">
              <X className="w-5 h-5" />
            </IconContainer>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-6 bg-transparent">
            
            <GlassPanel className="p-4 flex flex-col h-[300px]">
              <div className="flex items-center gap-2 text-[#888] mb-4">
                <Activity className="w-4 h-4 text-white/50" />
                <h3 className="font-mono font-bold text-[10px] tracking-widest uppercase">Risk Vector Analysis</h3>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#222" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                    <Radar name="User" dataKey="A" stroke={riskColor} fill={riskColor} fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel className="p-4 flex flex-col h-[300px]">
              <div className="flex items-center gap-2 text-[#888] mb-4">
                <ShieldAlert className="w-4 h-4 text-white/50" />
                <h3 className="font-mono font-bold text-[10px] tracking-widest uppercase">Risk Trajectory</h3>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={riskColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={riskColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="risk" stroke={riskColor} strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            {/* Alerts List */}
            {user.active_alerts.length > 0 && (
              <GlassPanel className="col-span-2 p-4 border-[#ff3366]/30">
                <h3 className="font-mono font-bold text-[10px] tracking-widest uppercase text-[#ff3366] mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Active Alerts ({user.active_alerts.length})
                </h3>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {user.active_alerts.map(alert => (
                    <div key={alert.id} className="bg-black/50 border border-[#222] p-3 rounded-lg flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#ff3366] animate-pulse mt-1.5 shadow-[0_0_10px_#ff3366]" />
                      <div>
                        <div className="text-sm text-white font-medium">{alert.message}</div>
                        <div className="text-[10px] text-[#888] font-mono tracking-widest uppercase mt-1">
                          {new Date(alert.timestamp).toLocaleString()} • {alert.scenario_id || 'Anomaly'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#222] bg-black/40">
            <SoarActions user={user} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
