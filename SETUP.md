# 🚀 SHADOW-HUNT Local Setup Guide

Welcome to the **SHADOW-HUNT** project! This guide will help you set up the entire microservice stack on your local machine so you can run the Autonomous UEBA platform without any errors.

---

## 🛠️ 1. Prerequisites

Before you start, make sure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.10 or higher) - [Download here](https://www.python.org/downloads/)
- **Git** - [Download here](https://git-scm.com/downloads)

*(Optional but recommended)* A Python virtual environment tool like `venv` or `conda` to keep dependencies clean.

---

## 📥 2. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/Jaimin2687/Shadow-Hunt.git
cd Shadow-Hunt
```

---

## ⚡ 3. The Quick Way (Mac / Linux)

If you are on macOS or Linux, we have provided an automated script that installs dependencies (where needed) and starts all 4 services at once.

1. **Make the script executable:**
   ```bash
   chmod +x runall.sh
   ```

2. **Run the stack:**
   ```bash
   ./runall.sh
   ```

3. **Run with automated E2E tests (Highly Recommended):**
   ```bash
   ./runall.sh --test
   ```
   *This will start the servers and then send dummy data to verify that the risk scoring and latency constraints are working perfectly.*

Once the script says `ALL SERVICES RUNNING`, open your browser and navigate to:
👉 **`http://localhost:3000`**

To stop everything, simply press `Ctrl+C` in the terminal where the script is running.

---

## ⚙️ 4. The Manual Way (Windows / Step-by-Step)

If the bash script doesn't work for your OS (e.g., Windows), or you want to run the services in separate terminal windows, follow these steps:

### Step A: Start the UEBA Engine (Python)
The engine runs the anomaly detection and risk scoring logic.
```bash
cd engine
# Optional: Create and activate a virtual environment
# python -m venv venv && source venv/bin/activate (Mac/Linux) or venv\Scripts\activate (Windows)

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Expected Output:* `Uvicorn running on http://0.0.0.0:8000`

### Step B: Start the Orchestrator (Node.js)
The orchestrator acts as the central hub handling WebSockets and risk state.
```bash
# Open a NEW terminal window
cd orchestrator
npm install
npm run dev
# OR: npx tsx src/server.ts
```
*Expected Output:* `Orchestrator ready on port 4000`

### Step C: Start the Dashboard (Next.js)
The sleek UI where analysts interact with the system.
```bash
# Open a NEW terminal window
cd dashboard
npm install
npm run dev -- -p 3000
```
*Expected Output:* `Ready in XXXms` (Open `http://localhost:3000`)

### Step D: Start the Telemetry Simulator (Python)
The simulator generates network traffic and cyber-attack scenarios.
```bash
# Open a NEW terminal window
cd simulator
# Optional: Use virtual environment
pip install -r requirements.txt
python simulator.py
```
*Expected Output:* `Control server running on port 5555`

---

## 🚨 5. Troubleshooting & Common Errors

### ❌ "Port Already in Use"
If you see an error like `EADDRINUSE` or `[Errno 98] Address already in use`, it means another application is running on one of our required ports (`3000`, `4000`, `5555`, or `8000`).
**Fix (Mac/Linux):**
```bash
# Find the PID using the port, e.g., 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### ❌ Python `ModuleNotFoundError`
If you try to run the Engine or Simulator and see `ModuleNotFoundError: No module named 'fastapi'` (or similar):
**Fix:** Ensure you ran `pip install -r requirements.txt` inside that specific folder (`engine/` or `simulator/`).

### ❌ Dashboard shows "CONNECTION LOST"
This means the Dashboard cannot reach the Orchestrator via WebSockets.
**Fix:** Ensure the Orchestrator terminal (Step B) is running and shows no errors. Check that it is running on exactly port `4000`.

### ❌ "Permission Denied" on `./runall.sh`
**Fix:** You need to give the script execution permissions. Run `chmod +x runall.sh`.

---

🎉 **You're all set! Hunt the shadows before they strike!**
