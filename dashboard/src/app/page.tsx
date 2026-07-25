'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Activity, Zap, Eye, Lock, ArrowRight, Radio, Fingerprint, Brain } from 'lucide-react';

const ParticleField = dynamic(() => import('@/components/three/ParticleField'), { ssr: false });
const AmbientOrbs = dynamic(() => import('@/components/effects/AmbientOrbs'), { ssr: false });

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
      {/* 1. Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleField />
        <AmbientOrbs />
        {/* 3D Perspective Grid */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] grid-floor"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 20%, black 80%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, black 80%)',
            transform: 'perspective(1000px) rotateX(60deg) translateY(100px) scale(2.5)',
            transformOrigin: 'bottom',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* 2. Fixed Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="font-bold tracking-tight text-white text-lg">SHADOW-HUNT</span>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] hover:bg-neutral-200 transition-colors"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </nav>

      <main ref={containerRef} className="relative z-10 pt-24 px-6 md:px-12 lg:px-24">
        
        {/* 3. Hero Section */}
        <motion.section 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="min-h-[90vh] flex flex-col items-center justify-center text-center pt-16 pb-24"
        >
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center max-w-5xl"
          >
            <motion.div variants={itemVariants} className="mb-8 border border-[#333] rounded-full px-4 py-1.5 bg-white/5 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-medium">✦ AI-POWERED INSIDER THREAT DETECTION</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.95] mb-6">
              Hunt the <br/>
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent italic">shadows.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-[#888] max-w-2xl mb-12 leading-relaxed">
              Real-time user behavior analytics, ML-powered anomaly detection, and autonomous SOAR remediation — all in sub-20ms.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-medium shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)]"
                >
                  Enter Command Center
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center px-8 py-4 rounded-full font-medium border border-[#333] text-white hover:bg-white/5 transition-colors"
                >
                  View Architecture
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* 4. Stats Strip */}
        <motion.section 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-32"
        >
          {[
            { value: "<20ms", label: "E2E LATENCY" },
            { value: "5", label: "ATTACK SCENARIOS" },
            { value: "293", label: "REQ/S THROUGHPUT" },
            { value: "24/7", label: "AUTONOMOUS MONITORING" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#222] rounded-xl p-6 flex flex-col items-center justify-center text-center"
            >
              <span className="font-mono text-3xl font-bold text-white mb-2">{stat.value}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#666]">{stat.label}</span>
            </motion.div>
          ))}
        </motion.section>

        {/* 5. Feature Grid Section */}
        <section id="features" className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-medium tracking-tighter">
              Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">zero-trust</span> detection.
            </h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Brain, title: "EWMA Risk Engine", desc: "Exponential Weighted Moving Average tracks compounding risk with 24h half-life decay. No static rules — pure behavioral math." },
              { icon: Zap, title: "Sub-20ms Pipeline", desc: "From telemetry ingestion to ML scoring to UI broadcast in under 20 milliseconds. Faster than human perception." },
              { icon: Shield, title: "Autonomous SOAR", desc: "Isolate accounts, revoke sessions, and step-up authentication with a single click. Automated containment at machine speed." },
              { icon: Eye, title: "Anomaly Heatmap", desc: "24-hour × department matrix visualizing event volume and attack distribution in real-time across Engineering, HR, and Finance." },
              { icon: Lock, title: "Zero-Trust APIs", desc: "API key authentication, Zod/Pydantic validation, rate limiting, and circuit breakers. Enterprise-hardened from day one." },
              { icon: Fingerprint, title: "Behavioral Profiling", desc: "PyOD Isolation Forests and Local Outlier Factors learn what normal looks like for every user, then flag deviations." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.15)' }}
                className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#222] rounded-xl p-8 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-[#222] flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#ccc]" />
                </div>
                <h3 className="text-lg font-medium text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-[#888] leading-relaxed flex-1">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 6. Architecture Showcase Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#222] rounded-2xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 z-0" />
            <div className="relative z-10">
              <h2 className="text-2xl font-medium text-white mb-10 text-center">The Pipeline</h2>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] -translate-y-1/2 z-0">
                  <div className="w-full h-full border-t border-dashed border-[#444] opacity-50 relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                      style={{ height: '2px', top: '-1px' }}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>

                {[
                  { icon: Radio, title: "Simulator", desc: "Synthetic telemetry & attack injection" },
                  { icon: Activity, title: "Orchestrator", desc: "WebSocket hub & risk accumulation" },
                  { icon: Brain, title: "Engine", desc: "PyOD ML anomaly scoring" },
                  { icon: Eye, title: "Dashboard", desc: "Real-time visualization & SOAR" }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#111] border border-[#333] rounded-xl p-6 w-full md:w-56 flex flex-col items-center text-center relative z-10 shadow-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-black border border-[#444] flex items-center justify-center mb-4">
                      <step.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-medium mb-2">{step.title}</h4>
                    <p className="text-xs text-[#777]">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

      </main>

      {/* 7. Footer */}
      <footer className="relative z-10 border-t border-[#222] py-8 px-6 md:px-12 lg:px-24 flex flex-col sm:flex-row items-center justify-between gap-4 bg-black">
        <span className="text-[11px] tracking-[0.3em] uppercase text-[#555]">SHADOW-HUNT</span>
        <span className="text-[11px] tracking-[0.3em] uppercase text-[#555]">InnovaHack Chapter 1</span>
      </footer>
    </div>
  );
}
