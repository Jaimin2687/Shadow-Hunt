'use client';
import { Activity } from 'lucide-react';
import { GlassPanel, MetricCard, Badge } from './ui/primitives';
import { motion } from 'framer-motion';

interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
}

export function LatencyOverlay({ stats }: { stats: LatencyStats }) {
  const getLatencyColor = (val: number) => {
    if (val > 50) return 'text-[#ff3366]';
    if (val > 20) return 'text-[#ffaa00]';
    return 'text-[#00ff88]';
  };

  const isSlaMet = stats.p99 < 20;

  return (
    <GlassPanel className="absolute top-4 right-4 p-4 min-w-[200px] z-50 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 border-b border-[#222] pb-2">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isSlaMet ? 'text-[#00ff88]' : 'text-[#ffaa00]'}`} />
          <span className="text-xs font-bold tracking-widest text-[#888888] uppercase">E2E Latency</span>
        </div>
        <Badge variant={isSlaMet ? 'emerald' : 'amber'}>
          {isSlaMet ? 'SUB-20ms SLA ✓' : 'SLA WARNING ⚠'}
        </Badge>
      </div>
      
      <div className="flex gap-4 font-mono text-sm justify-between">
        <div className="flex flex-col items-start">
          <span className="text-[10px] tracking-widest uppercase text-[#555555]">P50</span>
          <span className={getLatencyColor(stats.p50)}>{stats.p50.toFixed(1)}ms</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] tracking-widest uppercase text-[#555555]">P95</span>
          <span className={getLatencyColor(stats.p95)}>{stats.p95.toFixed(1)}ms</span>
        </div>
        <div className="flex flex-col items-start font-bold">
          <span className="text-[10px] tracking-widest uppercase text-[#555555]">P99</span>
          <span className={getLatencyColor(stats.p99)}>{stats.p99.toFixed(1)}ms</span>
        </div>
      </div>
    </GlassPanel>
  );
}
