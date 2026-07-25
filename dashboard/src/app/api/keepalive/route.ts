import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SCENARIO_API_URL = process.env.NEXT_PUBLIC_SCENARIO_API_URL || 'http://localhost:5555';
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000';

const endpoints = [
  { name: 'Orchestrator', url: `${API_URL}/api/health` },
  { name: 'Engine',       url: `${ENGINE_URL}/health` },
  { name: 'Simulator',    url: `${SCENARIO_API_URL}/status` },
];

/**
 * Server-side keep-alive endpoint.
 * Call this via an external cron service (e.g., cron-job.org, UptimeRobot)
 * every 5 minutes to keep all Render free-tier services alive even
 * when no one has the dashboard open.
 * 
 * GET /api/keepalive
 */
export async function GET() {
  const results = await Promise.allSettled(
    endpoints.map(async (ep) => {
      const start = Date.now();
      const res = await fetch(ep.url, { cache: 'no-store' });
      return {
        name: ep.name,
        status: res.status,
        latency_ms: Date.now() - start,
      };
    })
  );

  const report = results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return r.value;
    }
    return {
      name: endpoints[i].name,
      status: 'UNREACHABLE',
      error: (r.reason as Error)?.message || 'Unknown error',
    };
  });

  const allHealthy = report.every(
    (r) => 'status' in r && typeof r.status === 'number' && r.status < 400
  );

  return NextResponse.json(
    {
      ok: allHealthy,
      timestamp: new Date().toISOString(),
      services: report,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
