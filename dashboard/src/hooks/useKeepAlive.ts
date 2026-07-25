'use client';
import { useEffect, useRef } from 'react';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_URL = process.env.NEXT_PUBLIC_API_URL || (isLocal ? 'http://localhost:4000' : 'https://shadow-hunt-orchestrator.onrender.com');
const SCENARIO_API_URL = process.env.NEXT_PUBLIC_SCENARIO_API_URL || (isLocal ? 'http://localhost:5555' : 'https://shadow-hunt-simulator.onrender.com');
// Note: Engine is currently merged with orchestrator in standard deployment, but keeping URL fallback for safety
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || (isLocal ? 'http://localhost:8000' : 'https://shadow-hunt-orchestrator.onrender.com');

// Ping interval: 4 minutes (Render free tier sleeps after 15 min inactivity)
const PING_INTERVAL_MS = 4 * 60 * 1000;

const endpoints = [
  { name: 'Orchestrator', url: `${API_URL}/api/health` },
  { name: 'Engine',       url: `${ENGINE_URL}/health` },
  { name: 'Simulator',    url: `${SCENARIO_API_URL}/status` },
];

async function pingAll() {
  for (const ep of endpoints) {
    try {
      await fetch(ep.url, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
    } catch {
      // Silent — the ping itself is what matters, not the response
    }
  }
}

/**
 * Client-side keep-alive hook.
 * Pings all 3 Render backend services every 4 minutes to prevent
 * Render free-tier from spinning them down due to inactivity.
 * Only runs while the dashboard tab is open.
 */
export function useKeepAlive() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Ping immediately on mount
    pingAll();

    // Then every 4 minutes
    intervalRef.current = setInterval(pingAll, PING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
