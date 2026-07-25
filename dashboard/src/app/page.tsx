'use client';
import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { LiveFeed } from '@/components/LiveFeed';
import { RiskLeaderboard } from '@/components/RiskLeaderboard';
import { AttackToggle } from '@/components/AttackToggle';
import { AlertsBanner } from '@/components/AlertsBanner';
import { LatencyOverlay } from '@/components/LatencyOverlay';
import { AnomalyHeatmap } from '@/components/AnomalyHeatmap';
import { UserDeepDive } from '@/components/UserDeepDive';
import { Shield, Activity } from 'lucide-react';
import { UserRiskState } from '@/types/events';

export default function Dashboard() {
  const { events, totalEventsCount, riskUpdates, alerts, latencyStats, isConnected } = useWebSocket();
  const [selectedActor, setSelectedActor] = useState<{ user_id: string; username: string; department: string; role: string } | null>(null);
  const [isSimulationStopped, setIsSimulationStopped] = useState(false);
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
      active_alerts: []
    }
  ) : null;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden p-4 gap-4 bg-[#050a18] text-[#e8edf5]">
      {/* Top Bar */}
      <header className="flex items-center justify-between glass-card p-4 rounded-xl shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#00ff88]" />
          <h1 className="text-2xl font-bold tracking-wider">SHADOW-HUNT</h1>
          <div className="flex items-center gap-2 ml-6 text-sm text-[#7a8ba8]">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected && !isSimulationStopped ? 'bg-[#00ff88] animate-pulse-glow' : 'bg-[#ff3366]'}`} />
            {isSimulationStopped ? 'TRAFFIC STOPPED' : isConnected ? 'SYSTEM ACTIVE' : 'CONNECTION LOST'}
          </div>

          <button
            onClick={() => {
              if (isSimulationStopped) {
                api.startSimulation().then(() => setIsSimulationStopped(false));
              } else {
                api.stopSimulation().then(() => setIsSimulationStopped(true));
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1 rounded-lg border font-mono font-bold text-xs tracking-wider transition-all duration-300 ml-3 shadow-lg ${
              isSimulationStopped 
                ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/30 animate-pulse-glow shadow-[0_0_15px_rgba(0,255,136,0.3)]' 
                : 'bg-[#ff3366]/20 border-[#ff3366]/60 text-[#ff3366] hover:bg-[#ff3366]/30 hover:border-[#ff3366]'
            }`}
          >
            {isSimulationStopped ? '▶️ RESUME TELEMETRY' : '🛑 STOP TELEMETRY STREAM'}
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#7a8ba8] uppercase font-semibold">Events Processed</span>
            <span className="font-mono text-[#00ff88] text-lg">{totalEventsCount.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#7a8ba8] uppercase font-semibold">Active Alerts</span>
            <span className="font-mono text-[#ff3366] text-lg">{alerts.length}</span>
          </div>
          <LatencyOverlay stats={latencyStats} />
        </div>
      </header>

      <AlertsBanner 
        alerts={alerts} 
        riskUpdates={riskUpdates} 
        onSelectUser={(user) => setSelectedActor(user)} 
      />

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-8 flex flex-col min-h-0">
          <LiveFeed events={events} onSelectUser={(actor) => setSelectedActor(actor)} />
        </div>
        <div className="col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <RiskLeaderboard riskUpdates={riskUpdates} onSelectUser={(user) => setSelectedActor(user)} />
          </div>
          <div className="shrink-0">
            <AttackToggle />
          </div>
        </div>
      </main>

      {/* Heatmap Row */}
      <div className="shrink-0">
        <AnomalyHeatmap events={events} />
      </div>

      {/* Bottom Stats Bar */}
      <footer className="glass-card p-3 rounded-lg shrink-0 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-[#7a8ba8]">
          <Activity className="w-4 h-4" />
          <span>Real-time analysis running</span>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[#4a5a78]">Monitored Entities: </span>
            <span className="text-[#e8edf5] font-mono">{Object.keys(riskUpdates).length}</span>
          </div>
          {highestRisk && (
            <div>
              <span className="text-[#4a5a78]">Highest Risk: </span>
              <span className="text-[#ff3366] font-mono font-bold">
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
