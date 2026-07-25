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
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-orange?style=flat-square&logo=socketdotio)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-teal?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 🌐 Live Production URLs

SHADOW-HUNT is live! The architecture spans a highly available hybrid cloud using Vercel (Edge) and Render (Containers).

- **Dashboard (Vercel):** [https://shadow-hunt-omega.vercel.app](https://shadow-hunt-omega.vercel.app)
- **Orchestrator (Render):** [https://shadow-hunt-orchestrator.onrender.com](https://shadow-hunt-orchestrator.onrender.com)
- **Engine (Render):** [https://shadow-hunt-engine.onrender.com](https://shadow-hunt-engine.onrender.com)
- **Simulator (Render):** [https://shadow-hunt-simulator.onrender.com](https://shadow-hunt-simulator.onrender.com)

---

## What is SHADOW-HUNT?

SHADOW-HUNT is a high-performance **User and Entity Behavior Analytics (UEBA)** platform designed to detect insider threats, compromised accounts, and slow-burn data exfiltration in real time. 

Built with a decoupled microservice architecture, it processes high-velocity telemetry streams, scores user risk dynamically using an Exponential Weighted Moving Average (EWMA), and surfaces insights through a buttery-smooth, cyber-glass dashboard.

- Detects anomalous access patterns and data movement
- Evaluates risk instantly with sub-20ms end-to-end latency
- Empowers analysts to execute instant SOAR (Security Orchestration, Automation, and Response) remediation directly from the UI

---

## ✨ Core Feature Set

### 🔒 Enterprise-Grade Security & Resilience
Following a comprehensive security audit, the architecture has been fully hardened for production:
- **Zero-Trust APIs:** All sensitive routes are protected via API Key authentication (`x-api-key`).
- **Idempotent State Engine:** Prevents data corruption and duplicate alerts through 30-second time-window deduplication and logical state guards.
- **Circuit Breaker & Fallbacks:** The Node.js orchestrator uses `Opossum` circuit breakers and strict timeouts to prevent cascading socket failures if the ML Engine degrades.
- **Strict Payload Validation:** Enforces rigorous `Zod` and `Pydantic` schema validations, neutralizing injection and XSS threats.
- **Bounded Memory Management:** Custom LRU (Least Recently Used) caching with 24-hour TTLs prevents out-of-memory (OOM) crashes under heavy data floods.
- **Multi-Origin CORS & Keep-Alives:** Fully supports multi-domain CORS policies and includes a `useKeepAlive` hook with a serverless `/api/keepalive` cron endpoint to prevent free-tier cloud sleep.

### 🧠 Real-Time EWMA Risk Engine
SHADOW-HUNT doesn't just trigger dumb alerts. It tracks an **Exponential Weighted Moving Average (EWMA)** for every user. 
- **Attack Spikes:** Anomalous behavior immediately spikes the risk score to CRITICAL.
- **Normal Traffic:** Everyday actions slowly decay the risk over time (24h half-life), allowing analysts to focus only on sustained or severe threats.

### ⚡ Sub-20ms Telemetry Pipeline
The architecture consists of a Python Telemetry Simulator pumping data to a Node.js Orchestrator, which ferries it to a Python/FastAPI ML Engine. The result? Threat detection and UI broadcast happen in **~7ms**, well under the strict 20ms SLA.

### 🧊 Human-Readable "Stream Freeze"
High-velocity logs are impossible for humans to read. The Live Threat Feed includes a **Stream Freeze** toggle. When paused, the UI stops scrolling, while a background buffer silently catches new events. A pulsing missed-event banner lets you catch up instantly when ready.

### 🛡️ 1-Click SOAR Remediation
Don't just watch attacks happen—stop them. The Alerts Banner allows analysts to immediately execute SOAR actions:
- **ISOLATE ACCOUNT**
- **REVOKE SESSION**
- **STEP-UP AUTH**
- **FLAG FOR AUDIT**

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Dashboard** | Next.js 14 (App Router), React, Tailwind CSS |
| **Orchestrator** | Node.js (TypeScript), Express, `ws` (Native WebSockets) |
| **Engine** | Python 3, FastAPI, PyOD (IForest / LOF) |
| **Simulator** | Python 3, AIOHTTP |

---

## 🗺️ Application Architecture

```text
[Telemetry Simulator] (Python / Render)
      │
      ├─(HTTP JSON Events)──► [Orchestrator] (Node.js / Express / Render)
                                     │
                                     ├─► [Engine] (Python / FastAPI / Render)
                                     │    (Evaluates Anomaly / ML Pipeline)
                                     │    Returns: Risk Score & Insights
                                     │
                                     ▼ (Maintains EWMA Risk State & Thresholds)
                                     │
                            [WebSocket Broadcaster]
                                     │
                                     ▼ (Throttled 4fps to prevent UI hang)
                                     │
                           [Dashboard] (Next.js / Vercel Edge)
                             (Live Threat Feed, Heatmap, SOAR)
```

---

## 🚀 Local Development (Quick Start)

### Prerequisites
- **Node.js** 20+
- **Python** 3.10+

### 1. Clone the Repository

```bash
git clone https://github.com/Jaimin2687/Shadow-Hunt.git
cd Shadow-Hunt
```

### 2. Start All Services Locally

The easiest way to start the entire microservice stack is using the provided bash script.

```bash
# Starts Engine, Orchestrator, Dashboard, and Simulator concurrently
./runall.sh
```
Navigate to the Dashboard at: **`http://localhost:3000`**

---

## 🔒 Production Deployment Guide

The stack is designed for a split deployment:

### 1. Dashboard (Vercel)
- **Framework Preset:** Next.js
- **Root Directory:** `dashboard`
- **Env Vars Required:**
  - `NEXT_PUBLIC_API_URL` = `https://shadow-hunt-orchestrator.onrender.com`
  - `NEXT_PUBLIC_SCENARIO_API_URL` = `https://shadow-hunt-simulator.onrender.com`
  - `NEXT_PUBLIC_WS_URL` = `wss://shadow-hunt-orchestrator.onrender.com`
  - `NEXT_PUBLIC_API_KEY` = `shadow-hunt-api-key-production`
  - `NEXT_PUBLIC_CONTROL_KEY` = `shadow-hunt-sim-secret-production`
  - `NEXT_PUBLIC_ENGINE_URL` = `https://shadow-hunt-engine.onrender.com`

### 2. Backend Services (Render)
A `render.yaml` blueprint is provided in the root directory to instantly deploy the three backend services.
- **shadow-hunt-engine** (Python Web Service)
- **shadow-hunt-orchestrator** (Node Web Service)
- **shadow-hunt-simulator** (Python Web Service)

**Required Render Environment Variables:**
- `CLIENT_ORIGIN` (Orchestrator): `https://shadow-hunt-omega.vercel.app,http://localhost:3000`
- `DASHBOARD_URL` (Simulator): `https://shadow-hunt-omega.vercel.app,http://localhost:3000`
- `ORCHESTRATOR_URL` (Simulator): `https://shadow-hunt-orchestrator.onrender.com/api/telemetry`

---

<div align="center">

**Hunt the shadows before they strike.**

*SHADOW-HUNT — InnovaHack Chapter 1*

</div>
