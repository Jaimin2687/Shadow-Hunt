import requests, time

print("Starting flood of 600 unique users...")
for i in range(600):
    res = requests.post('http://localhost:4000/api/telemetry', json={
        'event_id': f'flood_{i}', 'timestamp': '2024-01-01T00:00:00Z',
        'event_category': 'auth', 'event_type': 'AD_LOGIN',
        'actor': {'user_id': f'user_{i}', 'username': f'user_{i}'},
        'target': {'resource_id': 'res_1'},
        'action': {'operation': 'LOGIN', 'status': 'SUCCESS'}
    })
    time.sleep(0.025)

print("Finished flooding.")
