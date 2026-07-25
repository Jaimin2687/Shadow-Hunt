'use client';

import { useState } from 'react';
import { UserRiskState } from '@/types/events';
import { UserDeepDive } from './UserDeepDive';
import { Crown, TrendingUp } from 'lucide-react';
import { GlassPanel, Badge } from './ui/primitives';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEPT_COLORS: Record<string, string> = {
  Engineering: 'text-[#00e5ff]',
  HR: 'text-[#00ff88]',
  Finance: 'text-[#ffaa00]',
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
    if (risk >= 70) return '#ffaa00';
    if (risk >= 50) return '#00e5ff';
    if (risk >= 30) return '#00ff88';
    return '#888888';
  };

  return (
    <>
      <GlassPanel accentColor="from-[#ff3366]/30 to-transparent" className="flex flex-col h-full overflow-hidden p-0">
        <div className="p-3 border-b border-[#222] flex items-center gap-2 bg-[#0a0a0a]">
          <Crown className="w-5 h-5 text-[#ffaa00]" />
          <h2 className="font-bold tracking-widest text-[10px] uppercase text-[#888888]">Risk Leaderboard</h2>
          <div className="flex-1" />
          <span className="text-[10px] uppercase tracking-widest text-[#555555]">{sorted.length} Users</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#050505]">
          {sorted.length === 0 && (
            <div className="text-center text-[#555555] text-[10px] uppercase tracking-widest py-8 font-mono animate-pulse">Awaiting telemetry stream...</div>
          )}
          <AnimatePresence>
            {sorted.map((user, i) => {
              const riskColor = getRiskColor(user.current_risk);
              const isHot = user.current_risk >= 70;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={user.user_id}
                  onClick={() => onSelectUser ? onSelectUser(user) : setSelectedUser(user)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 group",
                    isHot 
                      ? 'bg-[#0a0a0a]/85 border border-[#ff3366]/40 shadow-[0_0_15px_rgba(255,51,102,0.15)]' 
                      : 'bg-[#0a0a0a]/85 border border-[#222] hover:border-[#444]'
                  )}
                >
                  <span className="text-[#555555] font-mono text-xs w-5 text-center">
                    {i === 0 ? '👑' : `#${i + 1}`}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#ffffff] truncate">{user.username}</span>
                      <span className={cn("text-[9px] font-mono uppercase tracking-widest", DEPT_COLORS[user.department] || 'text-[#888888]')}>
                        {user.department}
                      </span>
                      {user.is_isolated && (
                        <Badge variant="crimson" className="text-[10px]">ISOLATED</Badge>
                      )}
                    </div>
                    <div className="mt-1 h-1.5 bg-[#000000] border border-[#222] rounded-full overflow-hidden relative">
                      <motion.div
                        layout
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, user.current_risk)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
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
                      className={cn(
                        "font-mono font-bold text-lg tabular-nums",
                        isHot ? 'animate-pulse' : ''
                      )}
                      style={{ color: riskColor }}
                    >
                      {user.current_risk.toFixed(0)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </GlassPanel>
      
      {selectedUser && (
        <UserDeepDive user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}
