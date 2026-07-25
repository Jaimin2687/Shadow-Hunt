'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Target, Zap, Clock } from 'lucide-react';

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
    <div className="glass-card rounded-xl flex flex-col h-full">
      <div className="p-3 border-b border-[#ff3366]/20 flex items-center gap-2 bg-[#ff3366]/5">
        <Target className="w-5 h-5 text-[#ff3366]" />
        <h2 className="font-bold tracking-widest text-sm text-[#e8edf5]">ATTACK SIMULATION CONTROL</h2>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto">
        {SCENARIOS.map(scenario => {
          const isActive = activeScenarios.has(scenario.id);
          return (
            <div 
              key={scenario.id}
              className={`p-3 rounded-lg border transition-all ${isActive ? 'bg-[#ff3366]/10 border-[#ff3366]/50 shadow-[0_0_15px_rgba(255,51,102,0.15)]' : 'bg-black/30 border-[#64b4ff]/10 hover:border-[#64b4ff]/30'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-sm ${isActive ? 'text-[#ff3366]' : 'text-white'}`}>{scenario.name}</h3>
                  {isActive && <span className="flex w-2 h-2 bg-[#ff3366] rounded-full animate-ping" />}
                </div>
                <button 
                  onClick={() => toggleScenario(scenario.id)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-[#ff3366]' : 'bg-[#4a5a78]'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-[#7a8ba8]">
                <span>{scenario.desc}</span>
                <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{scenario.target}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-[#64b4ff]/10 bg-black/20 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[#7a8ba8] text-xs font-bold uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          Time Scale Multiplier
        </div>
        <div className="flex gap-2">
          {[1, 2, 5, 10].map(scale => (
            <button
              key={scale}
              onClick={() => updateScale(scale)}
              className={`flex-1 py-1.5 rounded text-sm font-jetbrains font-bold transition-colors border ${timeScale === scale ? 'bg-[#3388ff]/20 text-[#3388ff] border-[#3388ff]/50' : 'bg-black/40 text-[#7a8ba8] border-[#4a5a78]/30 hover:bg-white/5'}`}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
