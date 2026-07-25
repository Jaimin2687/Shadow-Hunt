# 🛡️ SHADOW-HUNT — In-Depth Post-Remediation Security & Architecture Audit

**Date:** 2026-07-25  
**Auditor:** Antigravity (Principal Systems Architect & Senior Application Security Engineer)  
**Status:** **ENTERPRISE HARDENED**  

---

## 📖 Executive Overview

The SHADOW-HUNT platform initially demonstrated a highly performant data pipeline capable of handling 293 req/s under load. However, the initial architecture prioritized speed over safety, resulting in a fundamentally vulnerable system. It lacked authentication, boundary validations, fault tolerance, and memory constraints. 

Through a targeted, 10-phase remediation lifecycle, we have transformed the platform from a vulnerable proof-of-concept into an **Enterprise-Ready, Fault-Tolerant, and Zero-Trust architecture**. This document details the exact engineering patterns, libraries, and code transformations applied to secure the platform.

---

## 📊 Architectural Security Transformation Matrix

| Domain | Initial Baseline (Vulnerable State) | Hardened Architecture (Current State) | Technology / Pattern Applied |
| :--- | :--- | :--- | :--- |
| **API Security** | Anonymous access to all critical routes | Strict API Key (`x-api-key`) validation | Custom Express Middleware |
| **Payload Integrity** | Arbitrary strings accepted; XSS/Injection risk | Strict Schema Regex & Type Enforcement | `zod` (Node), `pydantic` (Python) |
| **State Consistency** | Duplicate requests multiply state / alerts | 30s Time-Window Deduplication & State Guards | Idempotent Logic Gates |
| **CORS Policy** | Global Wildcard (`*`) allowing cross-site attacks | Restricted to explicit frontend origins | Express & aiohttp CORS middleware |
| **Traffic Control** | Unlimited requests accepted; DoS vulnerability | Granular Rate Limiting (50 req/s, 10 req/m) | `express-rate-limit` |
| **Memory Management** | Unbounded `Map`/`Dict` growth leading to OOM | Bounded Eviction (500 User Cap) + 24h TTL | LRU Sorting & Garbage Collection |
| **Algorithmic Stability** | Crashes on $\Delta t = 0$, NaN / Infinity payloads | $\Delta t$ Zero-Guards, NaN Fallbacks, Clamping | Defensive Math & Safe Defaults |
| **Observability** | Unstructured `console.log` leaking PII/Secrets | Structured JSON Logging + Auto-Redaction | `winston`, `python-json-logger` |
| **Service Resilience** | Indefinite hangs on downstream Engine failure | 2s Timeouts + Fallback Circuit Breakers | `axios`, `opossum` Circuit Breaker |

---

## 🔍 Deep Dive: Vulnerability Remediation & Engineering Implementation

### Issue 1: Zero Authentication on All APIs (CRITICAL)
* **The Risk (Before):** The system lacked an identity boundary. Any actor on the network could inject telemetry, trigger SOAR actions (like `ISOLATE_ACCOUNT`), or dump all user risk profiles.
* **The Solution (After):** We implemented a robust API key authentication middleware pattern. The Orchestrator now strictly requires a valid `x-api-key` header (or query parameter) for sensitive endpoints, and the Python Simulator verifies an `X-Control-Key` before accepting commands.

> **Before:**
> ```typescript
> app.use('/api/respond', createRespondRouter(soarDispatcher));
> ```
> **After:**
> ```typescript
> // orchestrator/src/middleware/auth.ts
> export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
>   if (req.path === '/api/health') return next();
>   const key = req.headers['x-api-key'] || req.query.api_key;
>   if (!key || key !== process.env.API_KEY) {
>     return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
>   }
>   next();
> }
> 
> app.use('/api/respond', soarLimiter, apiKeyAuth, createRespondRouter(soarDispatcher));
> ```

---

### Issue 2: Runtime SOAR Payload Validation (CRITICAL)
* **The Risk (Before):** While TypeScript interfaces existed, they were erased at runtime. The API blindly accepted non-existent SOAR commands (e.g., `DELETE_ALL_DATA`), parsing them as valid and attempting to execute them.
* **The Solution (After):** Implemented strict runtime validation utilizing a highly performant JavaScript `Set` lookup to ensure only approved enum values can mutate the system state.

> **Before:**
> ```typescript
> const action = req.body as SoarAction;
> const result = await soarDispatcher.executeAction(action); // Blind execution
> ```
> **After:**
> ```typescript
> const VALID_ACTIONS = new Set(['ISOLATE_ACCOUNT', 'REVOKE_SESSION', 'FLAG_AUDIT', 'STEP_UP_AUTH']);
> if (!VALID_ACTIONS.has(action.action)) {
>   return res.status(400).json({ error: `Invalid action '${action.action}'` });
> }
> ```

---

### Issue 3: No Idempotency — Duplicate SOAR Actions Multiply (HIGH)
* **The Risk (Before):** A network retry or malicious loop sending 10 identical `ISOLATE_ACCOUNT` requests resulted in 10 identical alerts being appended to a user's risk history, artificially inflating metrics and corrupting UI state.
* **The Solution (After):** We designed an Idempotent State Engine. We added logical state guards (preventing isolation if already isolated) and a 30-second time-window deduplication check to swallow concurrent retry spam.

> **After Implementation:**
> ```typescript
> // orchestrator/src/services/riskAccumulator.ts
> // 1. Logical State Guard
> if (action.action === 'ISOLATE_ACCOUNT' && state.is_isolated) return state;
> 
> // 2. Time-Window Deduplication (30s)
> const recentDup = state.active_alerts.find(a => 
>   a.message.includes(action.action) && 
>   (Date.now() - new Date(a.timestamp).getTime()) < 30_000
> );
> if (recentDup) return state; // Safely swallow the duplicate
> ```

---

### Issue 4: CORS Wildcard on Orchestrator & Simulator (HIGH)
* **The Risk (Before):** `Access-Control-Allow-Origin: *` exposed the REST APIs to Cross-Site Request Forgery (CSRF) and unauthorized cross-origin browser reads from malicious domains.
* **The Solution (After):** We locked down the `cors` middleware in Node.js and the `aiohttp` middleware in Python to explicitly reflect only trusted dashboard origins defined in environment variables (defaulting to `http://localhost:3000`).

---

### Issue 5: No Rate Limiting — DoS Vulnerability (HIGH)
* **The Risk (Before):** The Express server attempted to process every request unconditionally. A localized script could fire thousands of requests per second, exhausting CPU cycles and starving legitimate traffic.
* **The Solution (After):** Integrated `express-rate-limit` to apply contextual throttling:
  * **Telemetry Ingestion:** Tolerates high-frequency bursting (Max 50 requests / second / IP).
  * **SOAR Actions:** Strictly limited to prevent abuse (Max 10 requests / minute / IP).

---

### Issue 6: Unbounded In-Memory State Growth (MEDIUM)
* **The Risk (Before):** The application maintained active states for users using in-memory structures (`Map` in Node.js, `dict` in Python). An attacker could send synthetic telemetry for millions of fake `user_ids`, causing a deliberate Out-Of-Memory (OOM) fatal crash.
* **The Solution (After):** Engineered a custom Least Recently Used (LRU) garbage collection cycle. The system now caps tracked users at a defined limit (e.g., 500) and evicts entries older than a 24-hour Time-To-Live (TTL).

> **After Implementation:**
> ```python
> # engine/app/api/score.py
> if len(user_states) >= MAX_USERS:
>     now = datetime.datetime.now(datetime.timezone.utc).timestamp()
>     sorted_users = sorted(user_states.items(), key=lambda item: item[1].last_event_time)
>     for uid, state in sorted_users:
>         if len(user_states) <= MAX_USERS * 0.8: break # Evict until 80% capacity
>         if now - state.last_event_time > EVICTION_TTL_SEC or len(user_states) >= MAX_USERS:
>             del user_states[uid]
> ```

---

### Issue 7: Schema Validation & Input Sanitization (MEDIUM)
* **The Risk (Before):** Unsanitized inputs (e.g., XSS payloads like `<script>alert(1)</script>`) were accepted and stored in the database, risking downstream rendering attacks in the React dashboard.
* **The Solution (After):** Replaced weak type casting with robust Schema Validation. We implemented `zod` in Node.js to strictly enforce alphanumeric bounds on `user_id`, and updated `pydantic` regex patterns in the Python Engine. Any payload deviating from expected structural boundaries is rejected with an HTTP 400.

---

### Issue 8: Engine Infinity Crash (MEDIUM)
* **The Risk (Before):** The Exponential Weighted Moving Average (EWMA) algorithm was mathematically brittle. Sending events with identical timestamps resulted in a $\Delta t$ of $0$, causing divide-by-zero exceptions. Similarly, edge-case math produced `NaN` (Not a Number) or `Infinity`, which crashed the PyOD machine learning models.
* **The Solution (After):** Implemented rigorous Mathematical Safety Guards.
  1. **Zero-Guards:** Forced $\Delta t$ to a minimum floor of `1.0` second.
  2. **Safe Fallbacks:** Wrapped final aggregation in `math.isnan()` and `math.isinf()` checks; if triggered, the engine falls back to the user's previously known safe score.
  3. **Value Clamping:** Capped scores using `min(risk_score, 100.0)`.

---

### Issue 9: Unstructured Logging & Data Leaks (LOW)
* **The Risk (Before):** System logs utilized plain `console.log()` and `print()`. Not only does this break parsing in modern SIEM/log aggregators (like Datadog/ELK), but it inherently risked leaking sensitive credentials (API keys) into plain text files.
* **The Solution (After):** Completely overhauled the observability pipeline. 
  * Replaced native printers with `winston` (Node.js) and `python-json-logger` (Python).
  * Implemented deep-scanning JSON formatters that automatically redact sensitive keys (`x-api-key`, `password`, `token`) before they reach `stdout`.

> **After Implementation (Log Output):**
> ```json
> {
>   "level": "warn",
>   "message": "Authentication failed",
>   "context": {
>     "endpoint": "/api/respond",
>     "provided_key": "[REDACTED]", 
>     "ip": "::1"
>   },
>   "timestamp": "2026-07-25T09:28:03.683Z"
> }
> ```

---

### Issue 10: Circuit Breaker & Timeout Resilience (SRE Dependency Architecture)
* **The Risk (Before):** The Node.js Orchestrator utilized native `fetch` without a timeout when communicating with the Python Engine. If the Engine slowed down or failed, the Orchestrator would pool open sockets indefinitely, leading to file descriptor exhaustion and a cascading, catastrophic system-wide failure.
* **The Solution (After):** Designed a highly resilient dependency layer.
  * Migrated from `fetch` to `axios` enforcing a strict `2000ms` HTTP timeout.
  * Wrapped the Axios client in an `Opossum` Circuit Breaker.
  * **Fallback Strategy:** If the Engine fails or the breaker trips (`50%` failure threshold), the Orchestrator safely swallows the error, logs an `Engine DEGRADED` warning, and returns a graceful baseline risk score (`0`). This ensures the Orchestrator never goes down, even if its dependencies do.

---

## 📌 Outstanding Architecture Items

While the REST APIs and internal state engines are fully hardened, the following peripheral component requires attention in the next sprint:

1. **WebSocket Connection Limits:** 
   * **Current State:** `orchestrator/src/ws/broadcaster.ts` accepts unlimited concurrent WebSocket connections.
   * **Action Required:** Enforce a `MAX_CLIENTS` connection limit to reject connection attempts when the WebSocket pool exceeds capacity, preventing potential socket exhaustion under connection flood scenarios.
