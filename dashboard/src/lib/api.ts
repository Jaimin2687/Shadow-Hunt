const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SCENARIO_API_URL = process.env.NEXT_PUBLIC_SCENARIO_API_URL || 'http://localhost:5555';

// Security keys matching the defaults in orchestrator and simulator
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'shadow-hunt-default-key';
const CONTROL_KEY = process.env.NEXT_PUBLIC_CONTROL_KEY || 'default-sim-secret';

const apiHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-api-key': API_KEY
});

const simHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-Control-Key': CONTROL_KEY
});

export const api = {
  fetchUsers: async () => {
    const res = await fetch(`${API_URL}/api/users`, { headers: apiHeaders() });
    return res.json();
  },
  fetchTopRiskyUsers: async (n: number) => {
    const res = await fetch(`${API_URL}/api/users/top/${n}`, { headers: apiHeaders() });
    return res.json();
  },
  fetchUser: async (userId: string) => {
    const res = await fetch(`${API_URL}/api/users/${userId}`, { headers: apiHeaders() });
    return res.json();
  },
  executeAction: async (action: string, targetUserId: string, note?: string) => {
    const res = await fetch(`${API_URL}/api/respond`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ action, target_user_id: targetUserId, analyst_note: note })
    });
    return res.json();
  },
  stopSimulation: async () => {
    const res = await fetch(`${SCENARIO_API_URL}/stop`, { method: 'POST', headers: simHeaders(), body: '{}' });
    return res.json();
  },
  startSimulation: async () => {
    const res = await fetch(`${SCENARIO_API_URL}/start`, { method: 'POST', headers: simHeaders(), body: '{}' });
    return res.json();
  },
  injectScenario: async (scenarioId: string) => {
    const res = await fetch(`${SCENARIO_API_URL}/inject`, {
      method: 'POST',
      headers: simHeaders(),
      body: JSON.stringify({ scenarioId })
    });
    return res.json();
  },
  setTimeScale: async (scale: number) => {
    const res = await fetch(`${SCENARIO_API_URL}/scale`, {
      method: 'POST',
      headers: simHeaders(),
      body: JSON.stringify({ scale })
    });
    return res.json();
  }
};
