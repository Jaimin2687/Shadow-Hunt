'use client';
import { useMemo } from 'react';
import { TelemetryEvent } from '@/types/events';
import { Grid3x3 } from 'lucide-react';
import { GlassPanel } from './ui/primitives';
import { motion } from 'framer-motion';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HeatmapProps {
  events: TelemetryEvent[];
}

export function AnomalyHeatmap({ events }: HeatmapProps) {
  const heatData = useMemo(() => {
    const grid: Record<string, Record<number, { total: number; attacks: number }>> = {};
    DEPARTMENTS.forEach(d => {
      grid[d] = {};
      HOURS.forEach(h => { grid[d][h] = { total: 0, attacks: 0 }; });
    });
    
    events.forEach(e => {
      const dept = e.actor?.department;
      if (!dept || !grid[dept]) return;
      const hour = new Date(e.timestamp).getHours();
      if (isNaN(hour)) return;
      grid[dept][hour].total++;
      if (e.ground_truth?.is_attack) grid[dept][hour].attacks++;
    });
    return grid;
  }, [events]);

  const maxTotal = useMemo(() => {
    let max = 1;
    DEPARTMENTS.forEach(d => HOURS.forEach(h => {
      if (heatData[d]?.[h]?.total > max) max = heatData[d][h].total;
    }));
    return max;
  }, [heatData]);

  const getColor = (total: number, attacks: number) => {
    if (total === 0) return 'rgba(255,255,255,0.02)';
    const intensity = Math.min(1, total / maxTotal);
    if (attacks > 0) {
      const attackRatio = attacks / total;
      return `rgba(255, 51, 102, ${0.2 + attackRatio * 0.7})`;
    }
    return `rgba(0, 255, 136, ${0.05 + intensity * 0.4})`;
  };

  return (
    <GlassPanel accentColor="from-amber-500/30 to-transparent" className="rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2 text-[#888888] mb-3">
        <Grid3x3 className="w-4 h-4" />
        <h3 className="font-bold text-xs tracking-widest uppercase text-white">Anomaly Heatmap</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[10px] text-[#888888]">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[#00ff88]/30 border border-[#00ff88]/50" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[#ff3366]/60 border border-[#ff3366]" /> Attack
          </span>
        </div>
      </div>
      
      {/* Hour labels */}
      <div className="flex ml-24 mb-1">
        {HOURS.filter((_, i) => i % 3 === 0).map(h => (
          <div key={h} className="font-mono text-[10px] tracking-widest uppercase text-[#555]" style={{ width: `${(100 / 8)}%` }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      
      {DEPARTMENTS.map(dept => (
        <div key={dept} className="flex items-center gap-2 mb-1">
          <span className="text-[11px] text-[#888888] w-22 text-right font-medium truncate flex-shrink-0 tracking-widest uppercase" style={{width: '88px'}}>
            {dept}
          </span>
          <div className="flex-1 flex gap-[2px]">
            {HOURS.map(h => {
              const cell = heatData[dept]?.[h] || { total: 0, attacks: 0 };
              const isAttack = cell.attacks > 0;
              return (
                <motion.div
                  key={h}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    boxShadow: isAttack ? ["0 0 0px rgba(255,51,102,0)", "0 0 10px rgba(255,51,102,0.8)", "0 0 0px rgba(255,51,102,0)"] : "none"
                  }}
                  transition={{
                    boxShadow: {
                      repeat: Infinity,
                      duration: 2
                    }
                  }}
                  className="flex-1 h-7 rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 relative group cursor-pointer"
                  style={{ backgroundColor: getColor(cell.total, cell.attacks) }}
                  title={`${dept} ${String(h).padStart(2,'0')}:00 — ${cell.total} events, ${cell.attacks} attacks`}
                >
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </GlassPanel>
  );
}
