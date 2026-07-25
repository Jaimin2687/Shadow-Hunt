'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Card = ({ className, children, ...props }: HTMLMotionProps<"div"> & { children?: React.ReactNode }) => {
  return (
    <motion.div
      className={cn("rounded-xl border border-[#222] bg-[#0a0a0a] shadow-sm", className)}
      whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.15)' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const GlassPanel = ({ className, children, accentColor, ...props }: React.HTMLAttributes<HTMLDivElement> & { accentColor?: string, children?: React.ReactNode }) => {
  return (
    <div className={cn("bg-[#0a0a0a]/85 backdrop-blur-xl border border-[#222] rounded-xl overflow-hidden relative", className)} {...props}>
      {accentColor && (
        <div className={cn("absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r", accentColor)} />
      )}
      {children}
    </div>
  );
};

type BadgeVariant = 'emerald' | 'crimson' | 'amber' | 'cyan' | 'neutral';

const badgeVariants: Record<BadgeVariant, string> = {
  emerald: "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 shadow-[0_0_10px_rgba(0,255,136,0.1)]",
  crimson: "bg-[#ff3366]/10 text-[#ff3366] border border-[#ff3366]/20 shadow-[0_0_10px_rgba(255,51,102,0.1)]",
  amber: "bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/20 shadow-[0_0_10px_rgba(255,170,0,0.1)]",
  cyan: "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]",
  neutral: "bg-white/10 text-white/70 border border-white/20",
};

export const Badge = ({ className, variant = 'neutral', children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant, children?: React.ReactNode }) => {
  return (
    <span className={cn("rounded-full font-mono text-[10px] tracking-wider uppercase px-2 py-0.5", badgeVariants[variant], className)} {...props}>
      {children}
    </span>
  );
};

export const IconContainer = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => {
  return (
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-[#222] group-hover:bg-white group-hover:text-black transition-colors", className)} {...props}>
      {children}
    </div>
  );
};

export const MetricCard = ({ className, value, label, accentColor, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string | number, label: string, accentColor?: string }) => {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <div className={cn("font-mono text-2xl font-bold text-white", accentColor)}>{value}</div>
      <div className="text-[10px] tracking-widest uppercase text-[#888]">{label}</div>
    </div>
  );
};
