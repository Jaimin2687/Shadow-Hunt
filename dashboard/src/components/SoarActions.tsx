'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { UserRiskState } from '@/types/events';
import { Shield, Key, Flag, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    { id: 'ISOLATE_ACCOUNT', name: 'Isolate Account', icon: Shield, color: 'text-[#ff3366]', border: 'border-[#ff3366]/30', shadow: 'hover:shadow-[0_0_15px_rgba(255,51,102,0.3)]' },
    { id: 'REVOKE_SESSION', name: 'Revoke Session', icon: Key, color: 'text-[#ffaa00]', border: 'border-[#ffaa00]/30', shadow: 'hover:shadow-[0_0_15px_rgba(255,170,0,0.3)]' },
    { id: 'FLAG_AUDIT', name: 'Flag for Audit', icon: Flag, color: 'text-[#00e5ff]', border: 'border-[#00e5ff]/30', shadow: 'hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]' },
    { id: 'STEP_UP_AUTH', name: 'Step-Up Auth', icon: Lock, color: 'text-[#00ff88]', border: 'border-[#00ff88]/30', shadow: 'hover:shadow-[0_0_15px_rgba(0,255,136,0.3)]' },
  ];

  return (
    <div className="flex gap-3 w-full">
      {actions.map((action) => {
        const Icon = action.icon;
        const isLoading = loadingAction === action.id;
        const isSuccess = successAction === action.id;

        return (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction(action.id, action.name)}
            disabled={!!loadingAction || !!successAction}
            className={`flex-1 relative overflow-hidden group bg-[#0a0a0a]/80 backdrop-blur-xl rounded-lg p-3 flex items-center justify-center gap-2 border transition-all duration-300 ${action.border} ${action.color} ${action.shadow}`}
          >
            {/* Background Glow on Hover */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
            
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold z-10 relative">
              {isSuccess ? 'EXECUTED' : action.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
