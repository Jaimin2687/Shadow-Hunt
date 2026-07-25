'use client';
import { useState, useEffect } from 'react';
import { TelemetryEvent } from '@/types/events';
import { Terminal, AlertTriangle, ArrowUpCircle, Play, Pause } from 'lucide-react';

const SEVERITY_COLORS = {
  INFORMATIONAL: 'text-[#3388ff]',
  LOW: 'text-[#00ffff]',
  MEDIUM: 'text-[#ffaa00]',
  HIGH: 'text-[#ff6600]',
  CRITICAL: 'text-[#ff3366] text-glow-red font-bold',
};

const DEPT_COLORS = {
  Engineering: 'bg-[#8855ff]/20 text-[#8855ff] border-[#8855ff]/30',
  HR: 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30',
  Finance: 'bg-[#3388ff]/20 text-[#3388ff] border-[#3388ff]/30',
};

export function LiveFeed({ 
  events, 
  onSelectUser 
}: { 
  events: TelemetryEvent[];
  onSelectUser?: (actor: { user_id: string; username: string; department: string; role: string }) => void;
}) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [frozenEvents, setFrozenEvents] = useState<TelemetryEvent[]>([]);
  const [missedCount, setMissedCount] = useState(0);

  useEffect(() => {
    if (autoScroll) {
      setFrozenEvents(events.slice(0, 80));
      setMissedCount(0);
    } else {
      if (events.length > 0 && frozenEvents.length > 0) {
        const latestFrozenId = frozenEvents[0]?.event_id;
        const index = events.findIndex(e => e.event_id === latestFrozenId);
        if (index > 0) {
          setMissedCount(index);
        }
      }
    }
  }, [events, autoScroll]);

  const handleToggleAutoScroll = () => {
    if (!autoScroll) {
      setAutoScroll(true);
      setMissedCount(0);
    } else {
      setAutoScroll(false);
      setFrozenEvents(events.slice(0, 80));
    }
  };

  const displayList = autoScroll ? events.slice(0, 80) : frozenEvents;

  return (
    <div className="glass-card rounded-xl flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="p-3 border-b border-[#64b4ff]/10 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-2 text-[#00ff88]">
          <Terminal className="w-5 h-5" />
          <h2 className="font-bold tracking-widest text-sm">LIVE THREAT FEED</h2>
          <div className={`w-2 h-2 rounded-full ${autoScroll ? 'bg-[#00ff88] animate-pulse-glow' : 'bg-amber-400'} ml-2`} />
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#7a8ba8]">{events.length} IN BUFFER</span>
          <button 
            onClick={handleToggleAutoScroll}
            className={`flex items-center gap-1.5 px-3 py-1 rounded border font-semibold transition-all duration-200 ${
              autoScroll 
                ? 'border-[#00ff88]/50 text-[#00ff88] bg-[#00ff88]/10 hover:bg-[#00ff88]/20' 
                : 'border-amber-400/50 text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
            }`}
          >
            {autoScroll ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
            STREAM: {autoScroll ? 'LIVE (ON)' : 'FROZEN (OFF)'}
          </button>
        </div>
      </div>

      {/* Missed Events Floating Banner */}
      {!autoScroll && missedCount > 0 && (
        <div 
          onClick={handleToggleAutoScroll}
          className="bg-gradient-to-r from-amber-500/20 via-[#00ff88]/20 to-amber-500/20 border-y border-[#00ff88]/40 py-2 px-4 flex items-center justify-center gap-2 text-xs font-mono font-bold text-[#00ff88] cursor-pointer hover:bg-white/10 transition-all animate-pulse shadow-lg shrink-0"
        >
          <ArrowUpCircle className="w-4 h-4 text-amber-400" />
          <span>+{missedCount} NEW TELEMETRY EVENTS RECEIVED — CLICK TO CATCH UP & RESUME STREAM</span>
        </div>
      )}

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto bg-[#030610] divide-y divide-[#64b4ff]/10">
        {displayList.length === 0 ? (
          <div className="p-8 text-center text-[#4a5a78] text-sm font-mono">
            Waiting for real-time telemetry stream...
          </div>
        ) : (
          displayList.map((event) => {
            const isAttack = event.ground_truth?.is_attack;
            const latency = event._t0_ns 
              ? (performance.now() + performance.timeOrigin - event._t0_ns / 1e6).toFixed(1)
              : '--';

            return (
              <div
                key={event.event_id}
                onClick={() => onSelectUser?.({
                  user_id: event.actor.user_id,
                  username: event.actor.username,
                  department: event.actor.department,
                  role: event.actor.role
                })}
                className={`flex items-center px-4 py-2.5 gap-4 text-sm font-mono transition-all duration-150 cursor-pointer hover:bg-white/10 hover:shadow-[inset_0_0_15px_rgba(0,255,136,0.15)] ${
                  isAttack ? 'bg-[#ff3366]/15 hover:bg-[#ff3366]/25 font-semibold' : ''
                }`}
              >
                <span className="text-[#5b6e94] w-24 shrink-0 font-medium">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                
                <span className={`w-28 shrink-0 text-xs font-semibold ${SEVERITY_COLORS[event.severity] || 'text-white'}`}>
                  {event.severity}
                </span>

                <span className="font-bold text-[#e8edf5] w-32 truncate shrink-0 text-white">
                  {event.actor.username}
                </span>

                <span className={`text-[11px] px-2.5 py-0.5 rounded border w-28 text-center shrink-0 font-sans font-bold tracking-wide ${
                  DEPT_COLORS[event.actor.department as keyof typeof DEPT_COLORS] || 'text-gray-400 border-gray-600'
                }`}>
                  {event.actor.department}
                </span>

                <span className="text-[#899bbd] w-36 shrink-0 truncate font-semibold">
                  {event.event_type}
                </span>

                <span className="flex-1 text-[#d2dde8] truncate min-w-0 font-sans text-xs">
                  {event.target.resource_name || event.target.file_path || event.target.resource_id}
                </span>

                {event.action.bytes_transferred !== undefined && (
                  <span className="text-[#64a1ff] w-20 text-right shrink-0 text-xs">
                    {(event.action.bytes_transferred / 1024).toFixed(1)}KB
                  </span>
                )}

                {isAttack ? (
                  <div className="flex items-center gap-1 bg-[#ff3366]/20 text-[#ff3366] px-2 py-0.5 rounded border border-[#ff3366]/60 animate-risk-pulse shrink-0 shadow-[0_0_8px_rgba(255,51,102,0.4)]">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px] font-bold font-sans tracking-wide">THREAT</span>
                  </div>
                ) : (
                  <div className="w-20 shrink-0 text-right text-[11px] text-[#4a5a78]">
                    NORMAL
                  </div>
                )}

                <span className="text-[#00ff88] text-[11px] w-14 text-right shrink-0 font-bold">
                  {latency}ms
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
