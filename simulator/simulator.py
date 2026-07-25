import argparse
import asyncio
import json
import logging
import math
import os
import random
import time
import uuid
from datetime import datetime, timezone
from aiohttp import ClientSession, web, ClientError

from config import ORCHESTRATOR_URL, EVENT_RATE_MS, TIME_SCALE, CONTROL_PORT
from employees import EMPLOYEES, EMPLOYEES_BY_ID
from scenarios import SCENARIOS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimulatorContext:
    def __init__(self):
        self.time_scale = TIME_SCALE
        self.event_rate_ms = EVENT_RATE_MS
        self.running_attacks = {}
        self.session = None
        self.total_events = 0
        self.is_stopped = False

ctx = SimulatorContext()

def is_active(hour, mean_hr, std_hr):
    # Determine probability of being active based on current hour
    dist = abs(hour - mean_hr)
    if dist < 4:  # roughly 8 hour workday
        return True
    return random.random() < 0.05  # small chance outside core hours

def generate_normal_event(emp):
    now = datetime.now(timezone.utc)
    hour = now.hour + (now.minute / 60)
    
    # 5% chance of legitimate late-night work for engineering
    if emp["department"] == "Engineering" and (hour < 6 or hour > 20):
        if random.random() > 0.05:
            return None
    elif not is_active(hour, emp["work_hours_mean"], emp["work_hours_std"]):
        return None

    event_type = random.choices(
        ["AD_LOGIN", "FILE_READ", "FILE_WRITE", "FILE_COPY", "VPN_CONNECT", "APP_RESOURCE_ACCESS"],
        weights=[5, 50, 20, 5, 10, 10], k=1
    )[0]
    
    resource = random.choice(emp["resources"])
    
    # 3% chance of cross-department shared access
    if random.random() < 0.03:
        other_emp = random.choice(EMPLOYEES)
        resource = random.choice(other_emp["resources"])
        
    is_vpn = random.random() < 0.30
    source_ip = "192.168.1.50" if is_vpn and event_type == "VPN_CONNECT" else emp["base_ip"]
    
    cat_map = {
        "AD_LOGIN": "auth",
        "VPN_CONNECT": "auth",
        "FILE_READ": "file_system",
        "FILE_WRITE": "file_system",
        "FILE_COPY": "file_system",
        "APP_RESOURCE_ACCESS": "resource_access"
    }

    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": now.isoformat(),
        "event_category": cat_map[event_type],
        "event_type": event_type,
        "severity": "INFORMATIONAL",
        "actor": {
            "user_id": emp["user_id"],
            "username": emp["username"],
            "department": emp["department"],
            "role": emp["role"],
            "source_ip": source_ip,
            "device_id": emp["device_id"]
        },
        "target": {
            "resource_id": f"res_{resource.split('/')[0]}",
            "resource_name": resource,
            "resource_type": "SERVER" if "://" not in resource else "SHARE",
            "file_path": f"/docs/file_{random.randint(1,100)}.txt"
        },
        "action": {
            "operation": event_type,
            "status": "SUCCESS",
            "bytes_transferred": random.randint(100, 10000),
            "session_id": f"sess_{uuid.uuid4().hex[:8]}"
        },
        "ground_truth": {
            "is_attack": False,
            "scenario_id": None,
            "attack_phase": None
        },
        "_t0_ns": time.time_ns()
    }

async def send_event(event):
    if not ctx.session or ctx.is_stopped:
        return
    event["_t0_ns"] = time.time_ns()
    try:
        async with ctx.session.post(ORCHESTRATOR_URL, json=event) as resp:
            pass
        ctx.total_events += 1
    except ClientError as e:
        logger.debug(f"Failed to send event: {e}")

async def run_scenario(scenario_id):
    scenario_func = SCENARIOS.get(scenario_id)
    if not scenario_func:
        return
    
    logger.info(f"Starting attack scenario {scenario_id}")
    try:
        async for event in scenario_func():
            while ctx.is_stopped:
                await asyncio.sleep(0.2)
                if scenario_id not in ctx.running_attacks:
                    break
            if scenario_id not in ctx.running_attacks:
                break
            await send_event(event)
    except Exception as e:
        logger.error(f"Scenario {scenario_id} error: {e}")
    finally:
        if scenario_id in ctx.running_attacks:
            del ctx.running_attacks[scenario_id]

async def normal_traffic_loop():
    while True:
        await asyncio.sleep((ctx.event_rate_ms / 1000.0) / max(0.1, ctx.time_scale))
        if ctx.is_stopped:
            continue
        emp = random.choice(EMPLOYEES)
        event = generate_normal_event(emp)
        if not event:
            # Try to find another active employee so traffic never stalls
            for cand in EMPLOYEES:
                event = generate_normal_event(cand)
                if event:
                    break
        if not event:
            # Guaranteed fallback: generate an event without letting off-hours suppress it
            now_hr = (datetime.now(timezone.utc).hour) % 24
            old_mean = emp["work_hours_mean"]
            emp["work_hours_mean"] = now_hr
            event = generate_normal_event(emp)
            emp["work_hours_mean"] = old_mean
        if event:
            await send_event(event)

# CORS Middleware
ALLOWED_ORIGIN = os.getenv('DASHBOARD_URL', 'http://localhost:3000')

@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        response = web.Response(status=200)
    else:
        try:
            response = await handler(request)
        except web.HTTPException as ex:
            response = ex
            
    origin = request.headers.get('Origin', '')
    if origin == ALLOWED_ORIGIN:
        response.headers['Access-Control-Allow-Origin'] = origin
    
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Control-Key'
    return response

# HTTP Handlers
async def handle_inject(request):
    secret = os.getenv("SIMULATOR_SECRET", "default-sim-secret")
    if request.headers.get("X-Control-Key") != secret:
        return web.json_response({"error": "Unauthorized"}, status=401)
        
    data = await request.json()
    scenario = data.get("scenario") or data.get("scenarioId")
    if scenario in SCENARIOS:
        task = asyncio.create_task(run_scenario(scenario))
        ctx.running_attacks[scenario] = task
        return web.json_response({"status": "injected", "scenario": scenario})
    return web.json_response({"error": "Unknown scenario"}, status=400)

async def handle_stop(request):
    secret = os.getenv("SIMULATOR_SECRET", "default-sim-secret")
    if request.headers.get("X-Control-Key") != secret:
        return web.json_response({"error": "Unauthorized"}, status=401)
        
    ctx.is_stopped = True
    for task in ctx.running_attacks.values():
        task.cancel()
    ctx.running_attacks.clear()
    return web.json_response({"status": "stopped", "is_stopped": True})

async def handle_start(request):
    secret = os.getenv("SIMULATOR_SECRET", "default-sim-secret")
    if request.headers.get("X-Control-Key") != secret:
        return web.json_response({"error": "Unauthorized"}, status=401)
        
    ctx.is_stopped = False
    return web.json_response({"status": "started", "is_stopped": False})

async def handle_scale(request):
    secret = os.getenv("SIMULATOR_SECRET", "default-sim-secret")
    if request.headers.get("X-Control-Key") != secret:
        return web.json_response({"error": "Unauthorized"}, status=401)
        
    data = await request.json()
    scale = data.get("time_scale", data.get("scale", 1.0))
    ctx.time_scale = float(scale)
    return web.json_response({"status": "scaled", "time_scale": ctx.time_scale})

async def handle_status(request):
    return web.json_response({
        "time_scale": ctx.time_scale,
        "running_attacks": list(ctx.running_attacks.keys()),
        "total_events": ctx.total_events,
        "is_stopped": ctx.is_stopped
    })

async def start_server():
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_post('/inject', handle_inject)
    app.router.add_options('/inject', lambda r: web.Response(status=200))
    app.router.add_post('/stop', handle_stop)
    app.router.add_options('/stop', lambda r: web.Response(status=200))
    app.router.add_post('/start', handle_start)
    app.router.add_options('/start', lambda r: web.Response(status=200))
    app.router.add_post('/scale', handle_scale)
    app.router.add_options('/scale', lambda r: web.Response(status=200))
    app.router.add_get('/status', handle_status)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', CONTROL_PORT)
    await site.start()
    logger.info(f"Control server running on port {CONTROL_PORT}")

async def main():
    parser = argparse.ArgumentParser(description="SHADOW-HUNT Telemetry Simulator")
    parser.add_argument('--rate', type=int, default=EVENT_RATE_MS, help='Event rate in ms')
    parser.add_argument('--scale', type=float, default=TIME_SCALE, help='Time scale factor')
    parser.add_argument('--attack', type=str, help='Scenario ID to start immediately')
    args = parser.parse_args()

    ctx.event_rate_ms = args.rate
    ctx.time_scale = args.scale

    async with ClientSession() as session:
        ctx.session = session
        
        await start_server()
        
        tasks = [asyncio.create_task(normal_traffic_loop())]
        
        if args.attack and args.attack in SCENARIOS:
            task = asyncio.create_task(run_scenario(args.attack))
            ctx.running_attacks[args.attack] = task
            
        await asyncio.gather(*tasks)

if __name__ == '__main__':
    asyncio.run(main())
