'use client';
import { UserRiskState } from '@/types/events';
import { X, ShieldAlert, Activity, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { SoarActions } from './SoarActions';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[#64b4ff]/20 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-[#64b4ff]/10 flex items-start justify-between bg-black/40 relative">
          <div className="flex gap-6 items-center z-10">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#0a1628] to-black border border-[#64b4ff]/20 flex items-center justify-center shadow-lg">
              <span className={`text-4xl font-jetbrains font-bold`} style={{ color: riskColor, textShadow: `0 0 20px ${riskColor}60` }}>
                {user.current_risk.toFixed(0)}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                {user.username}
                {user.is_isolated && (
                  <span className="text-xs bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/50 px-2 py-1 rounded font-bold uppercase tracking-wider">
                    Isolated
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3 text-sm text-[#7a8ba8]">
                <span className="text-[#e8edf5]">{user.role}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{user.department}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#7a8ba8] hover:text-white transition-colors rounded-full hover:bg-white/10 z-10">
            <X className="w-6 h-6" />
          </button>
          
          {/* Subtle background glow based on risk */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none blur-3xl rounded-full" 
               style={{ background: `radial-gradient(circle, ${riskColor} 0%, transparent 70%)` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-6 bg-[#030610]/50">
          
          <div className="glass-card rounded-xl p-4 flex flex-col border border-[#64b4ff]/5">
            <div className="flex items-center gap-2 text-[#7a8ba8] mb-4">
              <Activity className="w-4 h-4" />
              <h3 className="font-bold text-xs tracking-widest uppercase">Risk Vector Analysis</h3>
            </div>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#4a5a78" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a8ba8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                  <Radar name="User" dataKey="A" stroke={riskColor} fill={riskColor} fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex flex-col border border-[#64b4ff]/5">
            <div className="flex items-center gap-2 text-[#7a8ba8] mb-4">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="font-bold text-xs tracking-widest uppercase">Risk Trajectory (Last 100)</h3>
            </div>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={riskColor} stopOpacity={0.5}/>
                      <stop offset="95%" stopColor={riskColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #4a5a78', borderRadius: '8px' }}
                    itemStyle={{ color: '#e8edf5', fontFamily: 'JetBrains Mono' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke={riskColor} strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts List */}
          {user.active_alerts.length > 0 && (
            <div className="col-span-2 glass-card rounded-xl p-4 border border-[#ff3366]/20">
              <h3 className="font-bold text-xs tracking-widest uppercase text-[#ff3366] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Active Alerts ({user.active_alerts.length})
              </h3>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                {user.active_alerts.map(alert => (
                  <div key={alert.id} className="bg-[#ff3366]/10 border border-[#ff3366]/20 p-3 rounded-lg flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#ff3366] animate-pulse mt-1.5" />
                    <div>
                      <div className="text-sm text-white font-medium">{alert.message}</div>
                      <div className="text-xs text-[#7a8ba8] font-mono mt-1">
                        {new Date(alert.timestamp).toLocaleString()} • {alert.scenario_id || 'Anomaly'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#64b4ff]/10 bg-black/40">
          <SoarActions user={user} />
        </div>
      </div>
    </div>
  );
}
