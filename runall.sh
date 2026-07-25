#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────
#  SHADOW-HUNT  ▸  Run All Services
#  Usage:  ./runall.sh          → start everything
#          ./runall.sh --test   → start + run E2E scoring test
#          ./runall.sh --stop   → kill all services
# ─────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT/.pids"
mkdir -p "$PID_DIR"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
CYN='\033[0;36m'
MAG='\033[0;35m'
BLD='\033[1m'
RST='\033[0m'

banner() {
  echo ""
  echo -e "${MAG}╔═══════════════════════════════════════════════════╗${RST}"
  echo -e "${MAG}║${RST}  ${BLD}🔍 SHADOW-HUNT${RST}  ${CYN}Autonomous UEBA Platform${RST}          ${MAG}║${RST}"
  echo -e "${MAG}╚═══════════════════════════════════════════════════╝${RST}"
  echo ""
}

stop_all() {
  echo -e "${YLW}[✕] Stopping all services...${RST}"
  for f in "$PID_DIR"/*.pid; do
    [ -f "$f" ] || continue
    pid=$(cat "$f")
    name=$(basename "$f" .pid)
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null && echo -e "  ${RED}Stopped${RST} $name (PID $pid)"
    fi
    rm -f "$f"
  done
  # Cleanup any stragglers on our ports
  for port in 8000 4000 3000 5555; do
    lsof -ti ":$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
  done
  echo -e "${GRN}[✓] All services stopped${RST}"
}

wait_for_port() {
  local port=$1 name=$2 max=$3
  local i=0
  while ! curl -s "http://localhost:$port" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge "$max" ]; then
      echo -e "  ${RED}✗ $name failed to start on port $port${RST}"
      return 1
    fi
    sleep 1
  done
  echo -e "  ${GRN}✓${RST} ${BLD}$name${RST} ready on ${CYN}http://localhost:$port${RST}"
}

start_all() {
  banner

  # Kill anything lingering on our ports
  for port in 8000 4000 3000 5555; do
    lsof -ti ":$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
  done
  sleep 1

  # ── 1. Engine (Python / FastAPI) ──────────────────────────
  echo -e "${YLW}[1/4]${RST} Starting ${BLD}UEBA Engine${RST} (Python/FastAPI)..."
  cd "$ROOT/engine"
  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level warning > "$ROOT/.pids/engine.log" 2>&1 &
  echo $! > "$PID_DIR/engine.pid"
  wait_for_port 8000 "Engine" 30

  # ── 2. Orchestrator (Node.js / Express + WS) ─────────────
  echo -e "${YLW}[2/4]${RST} Starting ${BLD}Orchestrator${RST} (Node.js/Express + WebSocket)..."
  cd "$ROOT/orchestrator"
  npx tsx src/server.ts > "$ROOT/.pids/orchestrator.log" 2>&1 &
  echo $! > "$PID_DIR/orchestrator.pid"
  wait_for_port 4000 "Orchestrator" 15

  # ── 3. Dashboard (Next.js) ───────────────────────────────
  echo -e "${YLW}[3/4]${RST} Starting ${BLD}Dashboard${RST} (Next.js)..."
  cd "$ROOT/dashboard"
  npx next dev --port 3000 > "$ROOT/.pids/dashboard.log" 2>&1 &
  echo $! > "$PID_DIR/dashboard.pid"
  wait_for_port 3000 "Dashboard" 20

  # ── 4. Telemetry Simulator (Python on port 5555) ─────────
  echo -e "${YLW}[4/4]${RST} Starting ${BLD}Telemetry Simulator${RST} (Python on port 5555)..."
  cd "$ROOT/simulator"
  python3 simulator.py > "$ROOT/.pids/simulator.log" 2>&1 &
  echo $! > "$PID_DIR/simulator.pid"
  wait_for_port 5555 "Simulator" 15

  echo ""
  echo -e "${GRN}╔═══════════════════════════════════════════════════╗${RST}"
  echo -e "${GRN}║${RST}  ${BLD}ALL SERVICES RUNNING${RST}                              ${GRN}║${RST}"
  echo -e "${GRN}╠═══════════════════════════════════════════════════╣${RST}"
  echo -e "${GRN}║${RST}  🧠 Engine:       ${CYN}http://localhost:8000${RST}             ${GRN}║${RST}"
  echo -e "${GRN}║${RST}  ⚡ Orchestrator:  ${CYN}http://localhost:4000${RST}             ${GRN}║${RST}"
  echo -e "${GRN}║${RST}  🎨 Dashboard:    ${CYN}http://localhost:3000${RST}             ${GRN}║${RST}"
  echo -e "${GRN}║${RST}  📡 Simulator:    ${CYN}http://localhost:5555${RST}             ${GRN}║${RST}"
  echo -e "${GRN}╠═══════════════════════════════════════════════════╣${RST}"
  echo -e "${GRN}║${RST}  ${YLW}Press Ctrl+C to stop all services${RST}                 ${GRN}║${RST}"
  echo -e "${GRN}╚═══════════════════════════════════════════════════╝${RST}"
  echo ""
}

run_e2e_test() {
  echo -e "${MAG}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
  echo -e "${BLD}  🧪 E2E SCORING TEST${RST}"
  echo -e "${MAG}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
  echo ""

  pass=0
  fail=0

  send_event() {
    curl -s -X POST http://localhost:4000/api/telemetry \
      -H "Content-Type: application/json" \
      -d "$1"
  }

  get_risk() {
    echo "$1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('risk_score',0))" 2>/dev/null
  }

  # ── Normal baseline ───────────────────────────────────────
  echo -e "  ${CYN}Phase 1:${RST} Sending 8 normal events (alex.chen reading eng-docs)..."
  last_risk=0
  for i in $(seq 1 8); do
    R=$(send_event "{\"event_id\":\"n-$i\",\"timestamp\":\"2026-07-25T09:$(printf '%02d' $((i*5))):00Z\",\"event_category\":\"file_system\",\"event_type\":\"FILE_READ\",\"severity\":\"INFORMATIONAL\",\"actor\":{\"user_id\":\"eng_01\",\"username\":\"alex.chen\",\"department\":\"Engineering\",\"role\":\"Senior Engineer\",\"source_ip\":\"10.100.10.41\"},\"target\":{\"resource_id\":\"res_eng\",\"resource_name\":\"eng-docs\",\"resource_type\":\"SHARE\"},\"action\":{\"operation\":\"FILE_READ\",\"status\":\"SUCCESS\",\"bytes_transferred\":7000},\"ground_truth\":{\"is_attack\":false}}")
    last_risk=$(get_risk "$R")
  done
  if (( $(echo "$last_risk < 45" | bc -l) )); then
    echo -e "    ${GRN}✓ PASS${RST}  Normal baseline risk = ${BLD}$last_risk${RST} (expected < 45)"
    pass=$((pass+1))
  else
    echo -e "    ${RED}✗ FAIL${RST}  Normal baseline risk = ${BLD}$last_risk${RST} (expected < 45)"
    fail=$((fail+1))
  fi

  # ── Attack event ──────────────────────────────────────────
  echo -e "  ${CYN}Phase 2:${RST} Sending ATTACK (50MB finance file copy)..."
  R=$(send_event "{\"event_id\":\"atk-1\",\"timestamp\":\"2026-07-25T10:00:00Z\",\"event_category\":\"file_system\",\"event_type\":\"FILE_COPY\",\"severity\":\"HIGH\",\"actor\":{\"user_id\":\"eng_01\",\"username\":\"alex.chen\",\"department\":\"Engineering\",\"role\":\"Senior Engineer\",\"source_ip\":\"10.100.10.41\"},\"target\":{\"resource_id\":\"res_finance\",\"resource_name\":\"finance/M&A.xlsx\",\"resource_type\":\"SHARE\"},\"action\":{\"operation\":\"FILE_COPY\",\"status\":\"SUCCESS\",\"bytes_transferred\":52428800},\"ground_truth\":{\"is_attack\":true,\"scenario_id\":\"LOW_SLOW_EXFIL\"}}")
  atk_risk=$(get_risk "$R")
  if (( $(echo "$atk_risk >= 70" | bc -l) )); then
    echo -e "    ${GRN}✓ PASS${RST}  Attack risk = ${RED}${BLD}$atk_risk${RST} (expected ≥ 70)"
    pass=$((pass+1))
  else
    echo -e "    ${RED}✗ FAIL${RST}  Attack risk = ${BLD}$atk_risk${RST} (expected ≥ 70)"
    fail=$((fail+1))
  fi

  # ── Separation check ─────────────────────────────────────
  gap=$(echo "$atk_risk - $last_risk" | bc -l)
  if (( $(echo "$gap >= 50" | bc -l) )); then
    echo -e "    ${GRN}✓ PASS${RST}  Separation gap = ${BLD}${gap}${RST} points (expected ≥ 50)"
    pass=$((pass+1))
  else
    echo -e "    ${RED}✗ FAIL${RST}  Separation gap = ${BLD}${gap}${RST} points (expected ≥ 50)"
    fail=$((fail+1))
  fi

  # ── Post-attack decay ───────────────────────────────────
  echo -e "  ${CYN}Phase 3:${RST} Sending 5 recovery events (1h intervals)..."
  for i in $(seq 1 5); do
    R=$(send_event "{\"event_id\":\"post-$i\",\"timestamp\":\"2026-07-25T1$i:00:00Z\",\"event_category\":\"file_system\",\"event_type\":\"FILE_READ\",\"severity\":\"INFORMATIONAL\",\"actor\":{\"user_id\":\"eng_01\",\"username\":\"alex.chen\",\"department\":\"Engineering\",\"role\":\"Senior Engineer\",\"source_ip\":\"10.100.10.41\"},\"target\":{\"resource_id\":\"res_eng\",\"resource_name\":\"eng-docs\",\"resource_type\":\"SHARE\"},\"action\":{\"operation\":\"FILE_READ\",\"status\":\"SUCCESS\",\"bytes_transferred\":7000},\"ground_truth\":{\"is_attack\":false}}")
    last_risk=$(get_risk "$R")
  done
  if (( $(echo "$last_risk < $atk_risk" | bc -l) )); then
    echo -e "    ${GRN}✓ PASS${RST}  Post-attack risk decayed to ${BLD}$last_risk${RST} (< attack peak)"
    pass=$((pass+1))
  else
    echo -e "    ${RED}✗ FAIL${RST}  Post-attack risk = ${BLD}$last_risk${RST} (should be < $atk_risk)"
    fail=$((fail+1))
  fi

  # ── Innocent user ────────────────────────────────────────
  echo -e "  ${CYN}Phase 4:${RST} Sending 5 events for innocent user (elena.rostova)..."
  for i in $(seq 1 5); do
    R=$(send_event "{\"event_id\":\"fn-$i\",\"timestamp\":\"2026-07-25T08:$(printf '%02d' $((i*10))):00Z\",\"event_category\":\"file_system\",\"event_type\":\"FILE_READ\",\"severity\":\"INFORMATIONAL\",\"actor\":{\"user_id\":\"fin_01\",\"username\":\"elena.rostova\",\"department\":\"Finance\",\"role\":\"Controller\",\"source_ip\":\"10.100.30.41\"},\"target\":{\"resource_id\":\"res_erp\",\"resource_name\":\"erp-finance\",\"resource_type\":\"SERVER\"},\"action\":{\"operation\":\"FILE_READ\",\"status\":\"SUCCESS\",\"bytes_transferred\":3000},\"ground_truth\":{\"is_attack\":false}}")
    fin_risk=$(get_risk "$R")
  done
  if (( $(echo "$fin_risk < 45" | bc -l) )); then
    echo -e "    ${GRN}✓ PASS${RST}  Innocent user risk = ${BLD}$fin_risk${RST} (expected < 45)"
    pass=$((pass+1))
  else
    echo -e "    ${RED}✗ FAIL${RST}  Innocent user risk = ${BLD}$fin_risk${RST} (expected < 45)"
    fail=$((fail+1))
  fi

  # ── Latency check ────────────────────────────────────────
  latency=$(curl -s -X POST http://localhost:4000/api/telemetry \
    -H "Content-Type: application/json" \
    -d '{"event_id":"lat","timestamp":"2026-07-25T12:00:00Z","event_category":"file_system","event_type":"FILE_READ","severity":"INFORMATIONAL","actor":{"user_id":"eng_01","username":"alex.chen","department":"Engineering","role":"SE","source_ip":"10.100.10.41"},"target":{"resource_id":"res_eng","resource_name":"eng-docs","resource_type":"SHARE"},"action":{"operation":"FILE_READ","status":"SUCCESS","bytes_transferred":5000},"ground_truth":{"is_attack":false}}' \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('latency_ms',0))" 2>/dev/null)
  if (( $(echo "$latency < 20" | bc -l) )); then
    echo -e "    ${GRN}✓ PASS${RST}  E2E latency = ${BLD}${latency}ms${RST} (target < 20ms)"
    pass=$((pass+1))
  else
    echo -e "    ${YLW}⚠ WARN${RST}  E2E latency = ${BLD}${latency}ms${RST} (target < 20ms)"
  fi

  # ── Summary ──────────────────────────────────────────────
  echo ""
  total=$((pass + fail))
  if [ "$fail" -eq 0 ]; then
    echo -e "  ${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
    echo -e "  ${GRN}${BLD}  ALL $total TESTS PASSED ✓${RST}"
    echo -e "  ${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
  else
    echo -e "  ${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
    echo -e "  ${RED}${BLD}  $pass/$total PASSED, $fail FAILED${RST}"
    echo -e "  ${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
  fi
  echo ""
}

# ── Trap Ctrl+C to stop all services ───────────────────────
cleanup() {
  echo ""
  stop_all
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Main ───────────────────────────────────────────────────
case "${1:-}" in
  --stop)
    stop_all
    ;;
  --test)
    start_all
    run_e2e_test
    echo -e "${YLW}Services still running. Press Ctrl+C to stop, or open ${CYN}http://localhost:3000${RST}"
    # Keep alive
    while true; do sleep 1; done
    ;;
  *)
    start_all
    echo -e "  ${YLW}Tip:${RST} Run ${BLD}./runall.sh --test${RST} to also run E2E scoring verification"
    echo ""
    # Keep alive
    while true; do sleep 1; done
    ;;
esac
