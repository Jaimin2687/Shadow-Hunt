'use client';
import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useKeepAlive } from '@/hooks/useKeepAlive';
import { LiveFeed } from '@/components/LiveFeed';
import { AttackToggle } from '@/components/AttackToggle';
import { AlertsBanner } from '@/components/AlertsBanner';
import { LatencyOverlay } from '@/components/LatencyOverlay';
import { AnomalyHeatmap } from '@/components/AnomalyHeatmap';
import { UserDeepDive } from '@/components/UserDeepDive';
import { Shield, Activity } from 'lucide-react';
import { UserRiskState } from '@/types/events';
import { GlassPanel, MetricCard, IconContainer, Badge } from '@/components/ui/primitives';

export default function Dashboard() {
  useKeepAlive(); // Keep Render free-tier services alive
  const { events, totalEventsCount, riskUpdates, alerts, latencyStats, isConnected } = useWebSocket();
  const [selectedActor, setSelectedActor] = useState<{ user_id: string; username: string; department: string; role: string } | null>(null);
  const highestRisk = Object.values(riskUpdates).sort((a, b) => b.current_risk - a.current_risk)[0];

  const targetUser: UserRiskState | null = selectedActor ? (
    riskUpdates[selectedActor.user_id] || {
      user_id: selectedActor.user_id,
      username: selectedActor.username,
      department: selectedActor.department,
      role: selectedActor.role,
      current_risk: 10.0,
      peak_risk: 10.0,
      risk_history: [10.0],
      anomaly_count: 0,
      last_event_time: Date.now(),
      is_isolated: false,
      is_session_revoked: false,
      active_alerts: []
    }
  ) : null;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden p-4 gap-4 bg-black text-white selection:bg-emerald-500/30 font-sans relative">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#00ff88] rounded-full blur-[150px] opacity-[0.03]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-[#00e5ff] rounded-full blur-[120px] opacity-[0.02]" />
      </div>

      {/* Top Bar */}
      <GlassPanel className="p-4 shrink-0 z-10 flex items-center justify-between" accentColor="from-emerald-500/20 to-transparent">
        <div className="flex items-center gap-4">
          <IconContainer className="w-12 h-12">
            <Shield className="w-6 h-6 text-[#00ff88]" />
          </IconContainer>
          <h1 className="text-2xl font-bold tracking-tight">SHADOW-HUNT</h1>
          
          <div className="ml-4 flex items-center gap-2">
            <Badge variant={isConnected ? 'emerald' : 'crimson'} className={isConnected ? 'animate-pulseGlow' : ''}>
              {isConnected ? 'SYSTEM ACTIVE' : 'RECONNECTING...'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <MetricCard value={totalEventsCount.toLocaleString()} label="Events Processed" accentColor="text-[#00e5ff]" />
          <MetricCard value={alerts.length} label="Active Alerts" accentColor="text-[#ff3366]" />
          <LatencyOverlay stats={latencyStats} />
        </div>
      </GlassPanel>

      <div className="z-10">
        <AlertsBanner 
          alerts={alerts} 
          riskUpdates={riskUpdates} 
          onSelectUser={(user) => setSelectedActor(user)} 
        />
      </div>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-4 min-h-0 z-10">
        <div className="col-span-8 flex flex-col min-h-0">
          <LiveFeed events={events} onSelectUser={(actor) => setSelectedActor(actor)} />
        </div>
        <div className="col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <AttackToggle />
          </div>
        </div>
      </main>

      {/* Heatmap Row */}
      <div className="shrink-0 z-10">
        <AnomalyHeatmap events={events} />
      </div>

      {/* Bottom Stats Bar */}
      <footer className="shrink-0 flex items-center justify-between z-10 py-2 border-t border-[#222]">
        <div className="flex items-center gap-2 text-[#888]">
          <Activity className="w-4 h-4" />
          <span className="text-xs">Real-time analysis running</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-[#555] uppercase tracking-widest">Monitored Entities: </span>
            <span className="text-white">{Object.keys(riskUpdates).length}</span>
          </div>
          {highestRisk && (
            <div>
              <span className="text-[#555] uppercase tracking-widest">Highest Risk: </span>
              <span className="text-[#ff3366] font-bold">
                {highestRisk.username} ({highestRisk.current_risk.toFixed(1)})
              </span>
            </div>
          )}
        </div>
      </footer>

      {targetUser && (
        <UserDeepDive user={targetUser} onClose={() => setSelectedActor(null)} />
      )}
    </div>
  );
}
