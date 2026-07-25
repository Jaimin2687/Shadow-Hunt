import os

ORCHESTRATOR_URL = os.getenv('ORCHESTRATOR_URL', 'http://localhost:4000/api/telemetry')
EVENT_RATE_MS = int(os.getenv('EVENT_RATE_MS', '800'))
TIME_SCALE = float(os.getenv('TIME_SCALE', '1.0'))
CONTROL_PORT = int(os.getenv('PORT', '5555'))
