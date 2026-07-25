'use client';
import { useMemo } from 'react';
import { TelemetryEvent } from '@/types/events';
import { Grid3x3 } from 'lucide-react';

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
    <div className="glass-card rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2 text-[#7a8ba8] mb-3">
        <Grid3x3 className="w-4 h-4" />
        <h3 className="font-bold text-xs tracking-widest uppercase">Anomaly Heatmap</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[#00ff88]/30" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[#ff3366]/60" /> Attack
          </span>
        </div>
      </div>
      
      {/* Hour labels */}
      <div className="flex ml-24 mb-1">
        {HOURS.filter((_, i) => i % 3 === 0).map(h => (
          <div key={h} className="text-[9px] text-[#4a5a78] font-mono" style={{ width: `${(100 / 8)}%` }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      
      {DEPARTMENTS.map(dept => (
        <div key={dept} className="flex items-center gap-2 mb-1">
          <span className="text-[11px] text-[#7a8ba8] w-22 text-right font-medium truncate flex-shrink-0" style={{width: '88px'}}>
            {dept}
          </span>
          <div className="flex-1 flex gap-[2px]">
            {HOURS.map(h => {
              const cell = heatData[dept]?.[h] || { total: 0, attacks: 0 };
              return (
                <div
                  key={h}
                  className="flex-1 h-7 rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 relative group cursor-pointer"
                  style={{ backgroundColor: getColor(cell.total, cell.attacks) }}
                  title={`${dept} ${String(h).padStart(2,'0')}:00 — ${cell.total} events, ${cell.attacks} attacks`}
                >
                  {cell.attacks > 0 && (
                    <div className="absolute inset-0 rounded-sm animate-pulse border border-[#ff3366]/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
