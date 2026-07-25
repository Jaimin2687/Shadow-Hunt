'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Target, Zap, Clock } from 'lucide-react';
import { GlassPanel, Badge } from './ui/primitives';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SCENARIOS = [
  { id: 'exfil_low_slow', name: 'Low-and-Slow Exfiltration', target: 'alex.chen', desc: 'Gradual small file downloads over time' },
  { id: 'priv_esc_flight', name: 'Flight-Risk PrivEsc', target: 'sarah.jenkins', desc: 'Role change followed by sensitive access' },
  { id: 'impossible_travel', name: 'Impossible Travel', target: 'jessica.park', desc: 'Logins from distinct geographic regions' },
  { id: 'cred_sharing', name: 'Credential Sharing', target: 'ryan.hughes', desc: 'Simultaneous access from multiple devices' },
  { id: 'after_hours', name: 'After-Hours Harvest', target: 'diana.okafor', desc: 'Bulk DB queries during non-working hours' },
];

export function AttackToggle() {
  const [activeScenarios, setActiveScenarios] = useState<Set<string>>(new Set());
  const [timeScale, setTimeScale] = useState(1);
  const isAttacking = activeScenarios.size > 0;

  const toggleScenario = async (id: string) => {
    try {
      await api.injectScenario(id);
      const next = new Set(activeScenarios);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setActiveScenarios(next);
    } catch (err) {
      console.error('Failed to inject scenario', err);
    }
  };

  const updateScale = async (scale: number) => {
    try {
      await api.setTimeScale(scale);
      setTimeScale(scale);
    } catch (err) {
      console.error('Failed to set time scale', err);
    }
  };

  return (
    <GlassPanel className={cn("flex flex-col h-full", isAttacking && "border-[#ff3366] shadow-[0_0_15px_rgba(255,51,102,0.15)]")}>
      <div className="p-3 border-b border-[#222] flex items-center gap-2 bg-[#0a0a0a]">
        <Target className="w-5 h-5 text-[#ff3366]" />
        <h2 className="font-bold tracking-widest text-[10px] uppercase text-[#ffffff]">Attack Simulation Control</h2>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto bg-[#050505]">
        {SCENARIOS.map(scenario => {
          const isActive = activeScenarios.has(scenario.id);
          return (
            <div 
              key={scenario.id}
              className={cn(
                "p-3 rounded-xl border backdrop-blur-xl transition-all",
                isActive 
                  ? 'bg-[#0a0a0a]/85 border-[#ff3366] shadow-[0_0_15px_rgba(255,51,102,0.15)]' 
                  : 'bg-[#0a0a0a]/85 border-[#222] hover:border-[#333]'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className={cn("font-bold text-sm", isActive ? 'text-[#ff3366]' : 'text-[#ffffff]')}>{scenario.name}</h3>
                  {isActive && <span className="flex w-2 h-2 bg-[#ff3366] rounded-full animate-ping" />}
                </div>
                <button 
                  onClick={() => toggleScenario(scenario.id)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors border",
                    isActive ? 'bg-[#ff3366]/20 border-[#ff3366]' : 'bg-[#000000] border-[#333]'
                  )}
                >
                  <motion.span
                    layout
                    className={cn(
                      "inline-block h-3 w-3 transform rounded-full handle",
                      isActive ? "bg-[#ff3366] ml-5" : "bg-[#555555] ml-1"
                    )}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#888888]">
                <span>{scenario.desc}</span>
                <Badge variant="neutral">{scenario.target}</Badge>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-[#222] bg-[#0a0a0a] flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[#555555] text-[10px] font-bold uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          Time Scale Multiplier
        </div>
        <div className="flex gap-2">
          {[1, 2, 5, 10].map(scale => (
            <motion.button
              key={scale}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateScale(scale)}
              className={cn(
                "flex-1 py-1.5 rounded-xl text-sm font-mono font-bold transition-all border backdrop-blur-xl",
                timeScale === scale 
                  ? 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]' 
                  : 'bg-[#0a0a0a]/85 text-[#888888] border-[#222] hover:bg-[#222]/50'
              )}
            >
              {scale}x
            </motion.button>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
