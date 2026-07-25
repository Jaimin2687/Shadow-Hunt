<div align="center">

<br />

```
 ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗    ██╗  ██╗██╗   ██╗███╗   ██╗████████╗
 ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ██║  ██║██║   ██║████╗  ██║╚══██╔══╝
 ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║    ███████║██║   ██║██╔██╗ ██║   ██║   
 ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║    ██╔══██║██║   ██║██║╚██╗██║   ██║   
 ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝    ██║  ██║╚██████╔╝██║ ╚████║   ██║   
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   
```

**Autonomous UEBA & Insider Threat Interceptor.**

*Real-time user behavior analytics, anomaly detection, and 1-click SOAR remediation.*

<br />

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-orange?style=flat-square&logo=socketdotio)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-teal?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## What is SHADOW-HUNT?

SHADOW-HUNT is a high-performance **User and Entity Behavior Analytics (UEBA)** platform designed to detect insider threats, compromised accounts, and slow-burn data exfiltration in real time. 

Built with a decoupled microservice architecture, it processes high-velocity telemetry streams, scores user risk dynamically using an Exponential Weighted Moving Average (EWMA), and surfaces insights through a buttery-smooth, cyber-glass dashboard.

- Detects anomalous access patterns and data movement
- Evaluates risk instantly with sub-20ms end-to-to latency
- Empowers analysts to execute instant SOAR (Security Orchestration, Automation, and Response) remediation directly from the UI

---

## ✨ Core Feature Set

### 🔒 Enterprise-Grade Security & Resilience
Following a comprehensive security audit, the architecture has been fully hardened for production:
- **Zero-Trust APIs:** All sensitive routes are protected via API Key authentication (`x-api-key`).
- **Idempotent State Engine:** Prevents data corruption and duplicate alerts through 30-second time-window deduplication and logical state guards.
- **Circuit Breaker & Fallbacks:** The Node.js orchestrator uses `Opossum` circuit breakers and strict `axios` timeouts to prevent cascading socket failures if the ML Engine goes down.
- **Strict Payload Validation:** Enforces rigorous `Zod` and `Pydantic` schema validations, neutralizing injection and XSS threats.
- **Bounded Memory Management:** Custom LRU (Least Recently Used) caching with 24-hour TTLs prevents out-of-memory (OOM) crashes under heavy data floods.
- **Defensive Observability:** Structured JSON logging (`winston`, `python-json-logger`) with built-in PII and credential redaction, ready for SIEM ingestion.

### 🧠 Real-Time EWMA Risk Engine
SHADOW-HUNT doesn't just trigger dumb alerts. It tracks an **Exponential Weighted Moving Average (EWMA)** for every user. 
- **Attack Spikes:** Anomalous behavior immediately spikes the risk score to CRITICAL.
- **Normal Traffic:** Everyday actions slowly decay the risk over time (24h half-life), allowing analysts to focus only on sustained or severe threats.

### ⚡ Sub-20ms Telemetry Pipeline
The architecture consists of a Python Telemetry Simulator pumping data to a Node.js Orchestrator, which ferries it to a Python/FastAPI ML Engine. The result? Threat detection and UI broadcast happen in **~7ms**, well under the strict 20ms SLA.

### 🧊 Human-Readable "Stream Freeze"
High-velocity logs are impossible for humans to read. The Live Threat Feed includes a **Stream Freeze** toggle. When paused, the UI stops scrolling, while a background buffer silently catches new events. A pulsing missed-event banner lets you catch up instantly when ready.

### 🎨 Cyber-Glass "Un-Red" UI
Security dashboards cause visual fatigue with harsh reds and flat alerts. SHADOW-HUNT uses a premium **Glassmorphism aesthetic** featuring Deep Slate Blue, Amber, Cyan, and Emerald glows. The result is a gorgeous, interactive UI that feels like a next-gen command center.

### 🛡️ 1-Click SOAR Remediation
Don't just watch attacks happen—stop them. The Alerts Banner allows analysts to immediately execute SOAR actions:
- **ISOLATE ACCOUNT**
- **REVOKE SESSION**
- **STEP-UP AUTH**
- **FLAG FOR AUDIT**

The backend properly maps and applies these actions, instantly isolating the user across the simulated environment.

### 🛑 Master Traffic Control
A globally accessible master control button allows analysts to instantly halt or resume all simulated telemetry (both normal traffic and active attacks) via a direct `/stop` API command to the simulator.

---

## 🛠️ Technology Stack

### ⚡ Frameworks & Runtime
| Layer | Technology |
|---|---|
| Dashboard | Next.js 14 (App Router) |
| Orchestrator | Node.js (TypeScript) + Express |
| Engine | Python 3 + FastAPI |
| Simulator | Python 3 + AIOHTTP |

### 🎨 Styling & UI
| Layer | Technology |
|---|---|
| CSS Framework | Tailwind CSS |
| Icons | Lucide React |
| UI Paradigm | Cyber-Glassmorphism, Neon Glows |

### 🗄️ Real-time Communication
| Layer | Technology |
|---|---|
| Transport | Native WebSockets |
| Throttling | React `useRef` + 4Hz state polling for 60fps buttery smooth UI |

---

## 🗺️ Application Architecture

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

## 🏗️ Project Structure

```
SHADOW-HUNT/
├── SYSTEM_TRUTH.md                 # Canonical system spec & data contracts
├── runall.sh                       # Start script (with --test E2E scoring flag)
│
├── engine/                         # Python: UEBA & ML Pipeline
│   ├── app/main.py                 # FastAPI Entrypoint
│   └── requirements.txt            
│
├── orchestrator/                   # Node.js: Hub & WS Server
│   ├── src/routes/                 # /api/telemetry, /api/respond
│   ├── src/services/               # EWMA Risk Math & Action routing
│   └── package.json                
│
├── dashboard/                      # Next.js: Live UI
│   ├── src/app/page.tsx            # Main View + Master Stop/Start Control
│   ├── src/components/             # LiveFeed, Heatmap, AlertBanner, UserDeepDive
│   ├── src/hooks/useWebSocket.ts   # 250ms throttled WS state manager
│   └── package.json
│
└── simulator/                      # Python: Telemetry Injector
    ├── simulator.py                # Main loop + /start /stop endpoints
    └── scenarios.py                # Attack logic (LOW_SLOW_EXFIL, etc.)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+
- (Optional) Docker for containerized environments

### 1. Clone the Repository

```bash
git clone https://github.com/Jaimin2687/Shadow-Hunt.git
cd Shadow-Hunt
```

### 2. Quick Start (All Services)

The easiest way to start the entire microservice stack is using the provided bash script.

```bash
# Starts Engine, Orchestrator, Dashboard, and Simulator
./runall.sh
```

### 3. Run E2E Test Suite

To verify the installation, you can run the automated E2E scoring tests which validate the EWMA logic, attack spikes, decay rates, and sub-20ms latency SLA:

```bash
./runall.sh --test
```

### 4. Access the Platform

Once the stack is running, navigate to the Dashboard at:
**`http://localhost:3000`**

---

## 🔒 Deployment Strategy

SHADOW-HUNT is built to be deployed seamlessly across scalable cloud providers.

1. **Dashboard (Frontend) -> Vercel**
   - Import the Next.js directory into Vercel.
   - Set environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`).
2. **Orchestrator -> Railway / Render**
   - Deploy as a Node.js web service. Supports native WebSockets.
3. **Engine -> Railway / Render**
   - Deploy as a Python web service running `uvicorn app.main:app`.
4. **Simulator -> Railway / AWS EC2**
   - Run the Python script and point `ORCHESTRATOR_URL` to your hosted Node.js service.

---

<div align="center">

**Hunt the shadows before they strike.**

*SHADOW-HUNT — InnovaHack Chapter 1*

</div>
