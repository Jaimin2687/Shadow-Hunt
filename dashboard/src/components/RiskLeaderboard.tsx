'use client';
import { useState } from 'react';
import { UserRiskState } from '@/types/events';
import { UserDeepDive } from './UserDeepDive';
import { Crown, TrendingUp } from 'lucide-react';

const DEPT_COLORS: Record<string, string> = {
  Engineering: 'text-[#8855ff]',
  HR: 'text-[#00ff88]',
  Finance: 'text-[#3388ff]',
};

export function RiskLeaderboard({ 
  riskUpdates,
  onSelectUser
}: { 
  riskUpdates: Record<string, UserRiskState>;
  onSelectUser?: (user: UserRiskState) => void;
}) {
  const [selectedUser, setSelectedUser] = useState<UserRiskState | null>(null);
  
  const sorted = Object.values(riskUpdates).sort((a, b) => b.current_risk - a.current_risk);

  const getRiskColor = (risk: number) => {
    if (risk >= 85) return '#ff3366';
    if (risk >= 70) return '#ff6600';
    if (risk >= 50) return '#ffaa00';
    if (risk >= 30) return '#3388ff';
    return '#00ff88';
  };

  return (
    <>
      <div className="glass-card rounded-xl flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-[#64b4ff]/10 flex items-center gap-2 bg-black/20">
          <Crown className="w-5 h-5 text-[#ffaa00]" />
          <h2 className="font-bold tracking-widest text-sm text-[#ffaa00]">RISK LEADERBOARD</h2>
          <div className="flex-1" />
          <span className="text-xs text-[#4a5a78]">{sorted.length} USERS</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sorted.length === 0 && (
            <div className="text-center text-[#4a5a78] text-sm py-8 font-mono animate-pulse">Awaiting telemetry stream...</div>
          )}
          {sorted.map((user, i) => {
            const riskColor = getRiskColor(user.current_risk);
            const isHot = user.current_risk >= 70;
            return (
              <div
                key={user.user_id}
                onClick={() => onSelectUser ? onSelectUser(user) : setSelectedUser(user)}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 hover:translate-x-1.5 group ${
                  isHot ? 'bg-[#ff3366]/10 border border-[#ff3366]/40 shadow-[0_0_15px_rgba(255,51,102,0.15)]' : 'border border-transparent hover:border-[#64b4ff]/20'
                }`}
              >
                <span className="text-[#4a5a78] font-mono text-xs w-5 text-center">
                  {i === 0 ? '👑' : `#${i + 1}`}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#e8edf5] truncate">{user.username}</span>
                    <span className={`text-[9px] font-mono ${DEPT_COLORS[user.department] || 'text-[#7a8ba8]'}`}>
                      {user.department}
                    </span>
                    {user.is_isolated && (
                      <span className="text-[8px] bg-[#ff3366]/20 text-[#ff3366] px-1.5 py-0.5 rounded font-bold">ISOLATED</span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, user.current_risk)}%`,
                        backgroundColor: riskColor,
                        boxShadow: isHot ? `0 0 8px ${riskColor}80` : 'none'
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {user.anomaly_count > 0 && (
                    <TrendingUp className="w-3 h-3 text-[#ff3366]" />
                  )}
                  <span
                    className={`font-mono text-lg font-bold tabular-nums ${
                      isHot ? 'animate-risk-pulse' : ''
                    }`}
                    style={{ color: riskColor }}
                  >
                    {user.current_risk.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedUser && (
        <UserDeepDive user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}
