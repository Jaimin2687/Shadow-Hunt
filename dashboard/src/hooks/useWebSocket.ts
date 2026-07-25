import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryEvent, UserRiskState, Alert, WSMessage } from '../types/events';

interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
}

export function useWebSocket() {
  const [events, setEvents] = useState<TelemetryEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('sh_events');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [totalEventsCount, setTotalEventsCount] = useState<number>(0);
  const [riskUpdates, setRiskUpdates] = useState<Record<string, UserRiskState>>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('sh_risk');
      return cached ? JSON.parse(cached) : {};
    }
    return {};
  });
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('sh_alerts');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [isConnected, setIsConnected] = useState(false);
  const [latencyStats, setLatencyStats] = useState<LatencyStats>({ p50: 0, p95: 0, p99: 0 });

  const ws = useRef<WebSocket | null>(null);
  const eventsBuffer = useRef<TelemetryEvent[]>(events);
  const riskUpdatesBuffer = useRef<Record<string, UserRiskState>>(riskUpdates);
  const alertsBuffer = useRef<Alert[]>(alerts);
  const totalCountRef = useRef<number>(0);
  const latenciesBuffer = useRef<number[]>([]);
  const hasNewEvents = useRef(false);
  const hasNewRisk = useRef(false);
  const hasNewAlerts = useRef(false);
  const hasNewLatencies = useRef(false);

  const connect = useCallback(() => {
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      wsUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? 'wss://shadow-hunt-orchestrator.onrender.com/ws'
        : 'ws://localhost:4000/ws';
    }
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 3000);
    };

    ws.current.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        const receiveTime = performance.now() + performance.timeOrigin;

        if (msg._t0_ns) {
          const latency = receiveTime - msg._t0_ns / 1e6;
          latenciesBuffer.current.push(latency);
          if (latenciesBuffer.current.length > 100) latenciesBuffer.current.shift();
          hasNewLatencies.current = true;
        }

        if (msg.type === 'log_event') {
          const telemetryEvent = msg.payload as TelemetryEvent;
          eventsBuffer.current.unshift(telemetryEvent);
          totalCountRef.current += 1;
          if (eventsBuffer.current.length > 100) {
            eventsBuffer.current.length = 100;
          }
          hasNewEvents.current = true;
        } else if (msg.type === 'risk_update') {
          const risk = msg.payload as UserRiskState;
          riskUpdatesBuffer.current = { ...riskUpdatesBuffer.current, [risk.user_id]: risk };
          hasNewRisk.current = true;
        } else if (msg.type === 'alert') {
          const alert = msg.payload as Alert;
          alertsBuffer.current = [alert, ...alertsBuffer.current].slice(0, 30);
          hasNewAlerts.current = true;
        }
      } catch (err) {}
    };
  }, []);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasNewEvents.current) {
        const newEvents = [...eventsBuffer.current];
        setEvents(newEvents);
        if (typeof window !== 'undefined') localStorage.setItem('sh_events', JSON.stringify(newEvents));
        setTotalEventsCount(totalCountRef.current);
        hasNewEvents.current = false;
      }
      if (hasNewRisk.current) {
        const newRisk = { ...riskUpdatesBuffer.current };
        setRiskUpdates(newRisk);
        if (typeof window !== 'undefined') localStorage.setItem('sh_risk', JSON.stringify(newRisk));
        hasNewRisk.current = false;
      }
      if (hasNewAlerts.current) {
        const newAlerts = [...alertsBuffer.current];
        setAlerts(newAlerts);
        if (typeof window !== 'undefined') localStorage.setItem('sh_alerts', JSON.stringify(newAlerts));
        hasNewAlerts.current = false;
      }
      if (hasNewLatencies.current && latenciesBuffer.current.length > 0) {
        const sorted = [...latenciesBuffer.current].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
        const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
        setLatencyStats({ p50, p95, p99 });
        hasNewLatencies.current = false;
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return { events, totalEventsCount, riskUpdates, alerts, latencyStats, isConnected };
}
