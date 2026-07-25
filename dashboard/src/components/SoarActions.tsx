'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { UserRiskState } from '@/types/events';
import { Shield, Key, Flag, Lock, Loader2, CheckCircle2 } from 'lucide-react';

export function SoarActions({ user }: { user: UserRiskState }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successAction, setSuccessAction] = useState<string | null>(null);

  const handleAction = async (actionId: string, actionName: string) => {
    if (loadingAction || successAction) return;
    
    setLoadingAction(actionId);
    try {
      await api.executeAction(actionId, user.user_id, `Manual trigger from dashboard for ${user.username}`);
      setSuccessAction(actionId);
      setTimeout(() => setSuccessAction(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const actions = [
    { id: 'ISOLATE_ACCOUNT', name: 'Isolate Account', icon: Shield, color: 'text-[#ff3366]', border: 'border-[#ff3366]', bg: 'hover:bg-[#ff3366]/20' },
    { id: 'REVOKE_SESSION', name: 'Revoke Session', icon: Key, color: 'text-[#ffaa00]', border: 'border-[#ffaa00]', bg: 'hover:bg-[#ffaa00]/20' },
    { id: 'FLAG_AUDIT', name: 'Flag for Audit', icon: Flag, color: 'text-[#00ffff]', border: 'border-[#00ffff]', bg: 'hover:bg-[#00ffff]/20' },
    { id: 'STEP_UP_AUTH', name: 'Step-Up Auth', icon: Lock, color: 'text-[#3388ff]', border: 'border-[#3388ff]', bg: 'hover:bg-[#3388ff]/20' },
  ];

  return (
    <div className="flex gap-3 w-full">
      {actions.map((action) => {
        const Icon = action.icon;
        const isLoading = loadingAction === action.id;
        const isSuccess = successAction === action.id;

        return (
          <button
            key={action.id}
            onClick={() => handleAction(action.id, action.name)}
            disabled={!!loadingAction || !!successAction}
            className={`flex-1 relative overflow-hidden group glass-card rounded-lg p-3 flex items-center justify-center gap-2 border transition-all duration-300 ${action.border}/30 ${action.bg} ${action.color}`}
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-10 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
            
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
            
            <span className="font-bold text-sm tracking-wide">
              {isSuccess ? 'EXECUTED' : action.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
