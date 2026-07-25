# 🔍 SHADOW-HUNT

### Autonomous UEBA & Insider Threat Interceptor

> **Cybersecurity — Problem Statement 1**  
> _Real-time behavioral anomaly detection that catches what static SIEM rules miss._

---

## 🏗️ Architecture

```
┌──────────────┐    HTTP POST     ┌──────────────────┐    HTTP POST    ┌──────────────────┐
│   Simulator  │ ──────────────►  │   Orchestrator   │ ──────────────► │   UEBA Engine    │
│  (Python)    │                  │  (Node.js/Express)│                 │  (Python/FastAPI) │
│  Port: 5555  │                  │  Port: 4000      │ ◄────────────── │  Port: 8000      │
└──────────────┘                  │                  │   AnomalyResponse│                  │
                                  │  WebSocket (/ws) │                  │  PyOD + Features │
                                  └────────┬─────────┘                  └──────────────────┘
                                           │ RFC 6455
                                           ▼
                                  ┌──────────────────┐
                                  │    Dashboard     │
                                  │  (Next.js + TW)  │
                                  │  Port: 3000      │
                                  └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- npm

### 1. Install Dependencies

```bash
# Root
npm install

# Dashboard
cd dashboard && npm install && cd ..

# Orchestrator
cd orchestrator && npm install && cd ..

# Engine
cd engine && pip install -r requirements.txt && cd ..

# Simulator
cd simulator && pip install -r requirements.txt && cd ..
```

### 2. Start Services (3 terminals)

**Terminal 1 — Engine:**
```bash
cd engine && python -m uvicorn app.main:app --port 8000
```

**Terminal 2 — Orchestrator:**
```bash
cd orchestrator && npx tsx src/server.ts
```

**Terminal 3 — Dashboard:**
```bash
cd dashboard && npm run dev
```

### 3. Run Simulator
```bash
cd simulator && python simulator.py
```

Then visit **http://localhost:3000** 🎯

---

## 🧠 ML Pipeline

| Feature | Formula | Purpose |
|---------|---------|---------|
| **Access Novelty** | IDF-weighted rare resource access | Cross-department snooping |
| **Temporal Entropy** | Shannon entropy of hourly histogram | After-hours anomalies |
| **Volume Z-Score** | EWMA streaming Z-scores | Bulk data exfiltration |
| **Peer Deviation** | Euclidean distance from dept centroid | False positive suppression |
| **PyOD Score** | IForest + LOF with ECDF calibration | Unsupervised anomaly detection |

**Risk Aggregation:** Max-Dominant Hybrid fusion with exponential decay (24h half-life).

---

## 🎭 Attack Scenarios

| ID | Name | Actor | Pattern |
|----|------|-------|---------|
| A | Low-and-Slow Exfiltration | eng_04 (Alex Chen) | Engineer accesses finance shares, downloads M&A docs in 50MB chunks |
| B | Flight-Risk Privilege Escalation | hr_02 (Sarah Jenkins) | HR employee compromises service token, mass-clones repos |
| C | Impossible Travel | fin_03 (Jessica Park) | Login from NYC, then London 30 min later |
| D | Credential Sharing | eng_07 (Ryan Hughes) | Same account on 3 IPs simultaneously |
| E | After-Hours Harvesting | fin_05 (Diana Okafor) | Finance employee bulk downloading at 2-3 AM |

---

## 🎨 Dashboard Features

- **Live Threat Feed** — Virtualized, color-coded real-time event stream
- **Risk Leaderboard** — Top risky users with animated sorting
- **User Deep-Dive** — Radar chart + risk trajectory + SOAR actions
- **Attack Toggle Panel** — Inject attack scenarios from the UI
- **Latency Overlay** — P50/P95/P99 end-to-end latency display
- **Alerts Banner** — Critical/High alerts with auto-dismiss

---

## 🛡️ SOAR Actions

| Risk Score | Severity | Auto-Response |
|-----------|----------|---------------|
| ≥ 85 | CRITICAL | `ISOLATE_ACCOUNT` |
| ≥ 70 | HIGH | `REVOKE_SESSION` |
| ≥ 50 | MEDIUM | `FLAG_AUDIT` |
| ≥ 30 | LOW | `STEP_UP_AUTH` |
| < 30 | INFO | `MONITOR` |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Dashboard | Next.js 14, Tailwind CSS, Recharts, Lucide Icons |
| Orchestrator | Node.js, Express, WebSocket (ws) |
| ML Engine | Python, FastAPI, PyOD, NumPy, SciPy |
| Simulator | Python, aiohttp, asyncio |

---

## 🚢 Deployment

- **Dashboard** → Vercel
- **Orchestrator + Engine** → Railway / Render
- **Docker:** `docker compose up --build`

---

Built with 🔥 for Round 1 Hackathon
