'use client';
import { Activity } from 'lucide-react';

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
    <div className="flex flex-col items-end border-l border-[#64b4ff]/20 pl-6 ml-2">
      <div className="flex items-center gap-2 mb-1">
        <Activity className={`w-4 h-4 ${isSlaMet ? 'text-[#00ff88]' : 'text-[#ffaa00]'}`} />
        <span className="text-xs font-bold tracking-widest text-[#7a8ba8] uppercase">E2E Latency</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${isSlaMet ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30' : 'bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/30'}`}>
          {isSlaMet ? 'SUB-20ms SLA ✓' : 'SLA WARNING ⚠'}
        </span>
      </div>
      
      <div className="flex gap-4 font-jetbrains text-sm">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#4a5a78]">P50</span>
          <span className={getLatencyColor(stats.p50)}>{stats.p50.toFixed(1)}ms</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#4a5a78]">P95</span>
          <span className={getLatencyColor(stats.p95)}>{stats.p95.toFixed(1)}ms</span>
        </div>
        <div className="flex flex-col items-end font-bold">
          <span className="text-[10px] text-[#4a5a78]">P99</span>
          <span className={getLatencyColor(stats.p99)}>{stats.p99.toFixed(1)}ms</span>
        </div>
      </div>
    </div>
  );
}
