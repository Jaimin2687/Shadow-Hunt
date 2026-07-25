# SHADOW-HUNT — System Source of Truth

> **⚠️ MANDATORY FOR ALL AI AGENTS: Read this entire document before writing any code. Update the relevant sections after every change you make. This is the canonical reference — if this doc and the code disagree, fix the code.**

**Last Updated:** 2026-07-25
**Updated By:** Antigravity (AI) & Jaimin

---

## 1. Project Identity

| Key | Value |
|---|---|
| **Project Name** | SHADOW-HUNT |
| **Objective** | Autonomous UEBA (User & Entity Behavior Analytics) & Insider Threat Interceptor |
| **Domain** | Cybersecurity — Problem Statement 1 |
| **SLA/Performance Target** | E2E Latency < 20ms |

---

## 2. Architecture Overview

```text
[Telemetry Simulator] (Python, Port 5555)
      │
      ├─(Generates HTTP JSON Events)──► [Orchestrator] (Node.js/Express, Port 4000)
                                              │
                                              ├─► [Engine] (Python/FastAPI, Port 8000)
                                              │    (Evaluates Anomaly / ML Pipeline)
                                              │    Returns: Risk Score & Insights
                                              │
                                              ▼ (Maintains EWMA Risk State & Thresholds)
                                              │
                                     [WebSocket Broadcaster]
                                              │
                                              ▼ (Throttled 4fps to prevent UI hang)
                                              │
                                      [Dashboard] (Next.js, Port 3000)
                                           (Live Threat Feed, Heatmap, SOAR Actions)
```

---

## 3. Service Registry

| Service | Stack | Port | Directory | Status |
|---|---|---|---|---|
| **Engine** | Python 3 + FastAPI | `8000` | `engine/` | ✅ Complete (Anomalies & ML) |
| **Orchestrator** | Node.js (TS) + Express | `4000` | `orchestrator/` | ✅ Complete (Risk State & WS) |
| **Dashboard** | Next.js 14 + Tailwind | `3000` | `dashboard/` | ✅ Complete (Polished UI) |
| **Simulator** | Python 3 + AIOHTTP | `5555` | `simulator/` | ✅ Complete (Traffic Control) |

**Status Legend:** ⬜ Not Started · 🟡 In Progress · ✅ Complete · 🔴 Blocked

---

## 4. Environment Variables & Ports

All services communicate over local network ports. Configuration is environment-driven.

```env
# === Dashboard (.env.local / process.env) ===
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
NEXT_PUBLIC_SCENARIO_API_URL=http://localhost:5555

# === Orchestrator ===
PORT=4000
ENGINE_URL=http://localhost:8000/api/analyze

# === Simulator / Engine ===
CONTROL_PORT=5555
EVENT_RATE_MS=50
```

---

## 5. Data Contracts (IPC & WebSockets)

### 5.1 Telemetry Event (Simulator → Orchestrator → Engine)
```typescript
{
  "event_id": "uuid",
  "timestamp": "ISO8601 string",
  "event_category": "file_system | auth | network",
  "event_type": "FILE_READ | AD_LOGIN | VPN_CONNECT ...",
  "severity": "INFORMATIONAL | LOW | MEDIUM | HIGH | CRITICAL",
  "actor": {
    "user_id": "string",
    "username": "string",
    "department": "Engineering | HR | Finance",
    "role": "string",
    "source_ip": "string",
    "device_id": "string"
  },
  "target": { ... },
  "action": { ... },
  "ground_truth": { "is_attack": boolean, "scenario_id": string }, // For simulator scoring
  "_t0_ns": 1735689600000000000 // Injected latency tracking timestamp
}
```

### 5.2 User Risk State (Orchestrator → Dashboard WS)
```typescript
{
  "user_id": "string",
  "username": "string",
  "department": "string",
  "current_risk": 0-100, // EWMA decayed risk score
  "peak_risk": 0-100,
  "risk_history": [number],
  "anomaly_count": number,
  "is_isolated": boolean,
  "active_alerts": [Alert Object]
}
```

### 5.3 SOAR Action (Dashboard → Orchestrator)
```typescript
{
  "action": "ISOLATE_ACCOUNT | REVOKE_SESSION | FLAG_AUDIT | STEP_UP_AUTH",
  "target_user_id": "string (can fallback to username in orchestrator)",
  "analyst_note": "string"
}
```

---

## 6. Implementation Rules & Constraints

### 6.1 Performance Constraints (NON-NEGOTIABLE)
| Rule | Rationale |
|---|---|
| **E2E Latency < 20ms** | Must track exact `_t0_ns` from Simulator generation to Dashboard render. |
| **React State Throttling** | `useWebSocket` hook MUST buffer WS events and update React states no more than 4 times a second (250ms interval). Unthrottled `setEvents` crashes the browser on high simulated loads. |
| **Max UI DOM Elements** | Live Threat Feed is capped to 80 rendered elements to prevent browser hangs. `AnomalyHeatmap` leverages `useMemo` caching to avoid O(N^2) calculations per tick. |
| **Master Control Bypass** | The Master Stop Button MUST halt BOTH active attacks and the normal traffic loop immediately. |

### 6.2 UX / UI Guidelines
| Rule | Detail |
|---|---|
| **"Un-Red" Cyber Glassmorphism** | Alerts use Deep Slate Blue `#09152e`, Emerald `#00ff88`, and Cyan `#00e5ff` glows. Avoid flat warning reds which cause visual fatigue. |
| **Interactive Alerts** | Alert banners are fully clickable to launch the `UserDeepDive` modal. SOAR buttons sit directly on the alert row for 1-click remediation. |
| **Stream Freezing** | High velocity feeds are unreadable by humans. The live feed has a "Stream Freeze" toggle that holds the UI while gracefully queuing missed events in a sticky banner. |

---

## 7. Directory Structure

```text
SHADOW-HUNT/
├── SYSTEM_TRUTH.md                 # ← THIS FILE (living doc)
├── runall.sh                       # Start script (with --test E2E scoring flag)
│
├── engine/                         # Python: UEBA & ML Pipeline
│   ├── app/
│   │   ├── main.py
│   │   └── analyzer.py
│   └── requirements.txt
│
├── orchestrator/                   # Node.js: Hub & WS Server
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/                 # /api/telemetry, /api/respond
│   │   ├── services/
│   │   │   ├── riskAccumulator.ts  # EWMA Risk Math
│   │   │   └── soarDispatcher.ts   # Action routing
│   │   └── ws/
│   │       └── broadcaster.ts
│   └── package.json
│
├── dashboard/                      # Next.js: Live UI
│   ├── src/
│   │   ├── app/page.tsx            # Main View + Master Stop/Start Control
│   │   ├── components/             # LiveFeed, Heatmap, AlertBanner, UserDeepDive
│   │   ├── hooks/useWebSocket.ts   # 250ms throttled WS state manager
│   │   └── lib/api.ts
│   └── package.json
│
└── simulator/                      # Python: Telemetry Injector
    ├── simulator.py                # Main loop + /start /stop endpoints
    └── scenarios.py                # Attack logic (LOW_SLOW_EXFIL, etc.)
```

---

## 8. Task Tracker & Change Log

### Task Tracker
- [x] Project Scaffolding (Engine, Orchestrator, Dashboard, Simulator)
- [x] Implement E2E Test Suite (`runall.sh --test`)
- [x] Integrate User Risk EWMA Tracking (Exponential Moving Average decay)
- [x] Optimize Next.js Frontend (Throttled WS buffer, memoization, scroll freezing)
- [x] Cyberpunk "Un-Red" UI overhaul (Glows, glass cards, non-fatiguing colors)
- [x] SOAR Remediation Pipeline (Dashboard → Orchestrator backend)
- [x] Master Simulation Control (Stop/Start API integration)
- [x] Write canonical `SYSTEM_TRUTH.md`

### Change Log
| Date | Author | Change |
|---|---|---|
| 2026-07-25 | Antigravity | Optimized WebSocket state in React (eliminated UI freezing). |
| 2026-07-25 | Antigravity | Integrated Master Stop Control directly into the Simulator. |
| 2026-07-25 | Antigravity | Finished Cyber Glass UI and 1-click SOAR action mapping. |
| 2026-07-25 | Antigravity | Created SYSTEM_TRUTH.md as canonical instruction doc. |

---

> **REMINDER TO ALL AGENTS:** After making changes, update Section 3 (Service Registry status), Section 8 (Task Tracker checkboxes & Change Log). If you modify a data contract, update Section 5.
