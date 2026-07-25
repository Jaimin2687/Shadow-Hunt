'use client';

import React from 'react';
import { cn } from '@/lib/utils'; // Assuming standard cn utility is available

export default function AmbientOrbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Top-right Emerald orb */}
      <div 
        className="absolute top-0 right-0 bg-[#00ff88] opacity-[0.06] w-[35vw] h-[35vw] blur-[140px] rounded-full mix-blend-screen animate-float"
        style={{ animationDelay: '0s', transform: 'translate(20%, -20%)' }}
      />
      
      {/* Bottom-left Cyan orb */}
      <div 
        className="absolute bottom-0 left-0 bg-[#00e5ff] opacity-[0.04] w-[30vw] h-[30vw] blur-[120px] rounded-full mix-blend-screen animate-float"
        style={{ animationDelay: '2s', transform: 'translate(-20%, 20%)' }}
      />
      
      {/* Center-bottom Crimson orb */}
      <div 
        className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 bg-[#ff3366] opacity-[0.03] w-[25vw] h-[25vw] blur-[100px] rounded-full mix-blend-screen animate-float"
        style={{ animationDelay: '4s' }}
      />
    </div>
  );
}
