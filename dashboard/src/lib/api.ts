const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SCENARIO_API_URL = process.env.NEXT_PUBLIC_SCENARIO_API_URL || 'http://localhost:5555';

export const api = {
  fetchUsers: async () => {
    const res = await fetch(`${API_URL}/api/users`);
    return res.json();
  },
  fetchTopRiskyUsers: async (n: number) => {
    const res = await fetch(`${API_URL}/api/users/top/${n}`);
    return res.json();
  },
  fetchUser: async (userId: string) => {
    const res = await fetch(`${API_URL}/api/users/${userId}`);
    return res.json();
  },
  executeAction: async (action: string, targetUserId: string, note?: string) => {
    const res = await fetch(`${API_URL}/api/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, target_user_id: targetUserId, targetUserId, analyst_note: note, note })
    });
    return res.json();
  },
  stopSimulation: async () => {
    const res = await fetch(`${SCENARIO_API_URL}/stop`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    return res.json();
  },
  startSimulation: async () => {
    const res = await fetch(`${SCENARIO_API_URL}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    return res.json();
  },
  injectScenario: async (scenarioId: string) => {
    const res = await fetch(`${SCENARIO_API_URL}/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId })
    });
    return res.json();
  },
  setTimeScale: async (scale: number) => {
    const res = await fetch(`${SCENARIO_API_URL}/scale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scale })
    });
    return res.json();
  }
};
