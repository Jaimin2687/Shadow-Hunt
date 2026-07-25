import asyncio
import time
import uuid
from datetime import datetime, timezone
from employees import EMPLOYEES_BY_ID

def create_event(actor_id, event_category, event_type, severity, target_res_id, target_res_name, target_res_type, file_path, operation, status, bytes_transferred, scenario_id, attack_phase, source_ip=None):
    emp = EMPLOYEES_BY_ID[actor_id]
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_category": event_category,
        "event_type": event_type,
        "severity": severity,
        "actor": {
            "user_id": emp["user_id"],
            "username": emp["username"],
            "department": emp["department"],
            "role": emp["role"],
            "source_ip": source_ip or emp["base_ip"],
            "device_id": emp["device_id"]
        },
        "target": {
            "resource_id": target_res_id,
            "resource_name": target_res_name,
            "resource_type": target_res_type,
            "file_path": file_path
        },
        "action": {
            "operation": operation,
            "status": status,
            "bytes_transferred": bytes_transferred,
            "session_id": f"sess_{uuid.uuid4().hex[:8]}"
        },
        "ground_truth": {
            "is_attack": True,
            "scenario_id": scenario_id,
            "attack_phase": attack_phase
        },
        "_t0_ns": time.time_ns()
    }

async def scenario_a_low_and_slow():
    # eng_04
    yield create_event("eng_04", "resource_access", "APP_RESOURCE_ACCESS", "LOW", "share_finance", "share://finance-quarterly", "SHARE", "/", "ACCESS", "SUCCESS", 0, "LOW_SLOW_EXFIL", "Recon")
    
    intervals = [20, 10, 5]
    for interval in intervals:
        for _ in range(3): # 3 chunks per interval stage
            await asyncio.sleep(interval)
            yield create_event("eng_04", "file_system", "FILE_READ", "MEDIUM", "share_finance", "share://finance-quarterly", "SHARE", "/ma_docs/chunk.zip", "FILE_READ", "SUCCESS", 50000000, "LOW_SLOW_EXFIL", "Staging")
            
            yield create_event("eng_04", "network", "APP_RESOURCE_ACCESS", "HIGH", "ext_ip", "185.220.101.5", "SERVER", "/", "POST", "SUCCESS", 50000000, "LOW_SLOW_EXFIL", "Exfiltration")

async def scenario_b_flight_risk():
    # hr_02
    yield create_event("hr_02", "resource_access", "APP_RESOURCE_ACCESS", "LOW", "ldap", "ldap.internal", "SERVER", "/", "ENUMERATE", "SUCCESS", 5000, "FLIGHT_RISK_PRIVESC", "LDAP Enumeration")
    await asyncio.sleep(2)
    
    yield create_event("hr_02", "auth", "AD_AUTH_FAILURE", "MEDIUM", "git_internal", "git.internal", "SERVER", "/", "LOGIN", "FAILURE", 0, "FLIGHT_RISK_PRIVESC", "Auth Failure")
    await asyncio.sleep(1)
    yield create_event("hr_02", "auth", "AD_AUTH_FAILURE", "MEDIUM", "git_internal", "git.internal", "SERVER", "/", "LOGIN", "FAILURE", 0, "FLIGHT_RISK_PRIVESC", "Auth Failure")
    await asyncio.sleep(5)
    
    yield create_event("hr_02", "auth", "AD_LOGIN", "HIGH", "git_internal", "git.internal", "SERVER", "/", "LOGIN", "SUCCESS", 0, "FLIGHT_RISK_PRIVESC", "Privilege Escalation")
    await asyncio.sleep(2)
    
    for i in range(18):
        yield create_event("hr_02", "file_system", "FILE_READ", "CRITICAL", "git_internal", f"git.internal/repo_{i}", "REPOSITORY", "/", "CLONE", "SUCCESS", 266000000, "FLIGHT_RISK_PRIVESC", "Mass IP Theft")
        await asyncio.sleep(16.6)

async def scenario_c_impossible_travel():
    # fin_03
    yield create_event("fin_03", "auth", "AD_LOGIN", "LOW", "erp_finance", "erp-finance.internal", "SERVER", "/", "LOGIN", "SUCCESS", 0, "IMPOSSIBLE_TRAVEL", "Normal NYC login", source_ip="24.105.10.5")
    await asyncio.sleep(30)
    yield create_event("fin_03", "auth", "VPN_CONNECT", "HIGH", "vpn_gateway", "VPN_Gateway_UK", "VPN_GATEWAY", "/", "CONNECT", "SUCCESS", 0, "IMPOSSIBLE_TRAVEL", "London VPN login", source_ip="81.2.100.5")
    await asyncio.sleep(2)
    yield create_event("fin_03", "resource_access", "APP_RESOURCE_ACCESS", "CRITICAL", "erp_finance", "erp-finance.internal", "SERVER", "/", "ACCESS", "SUCCESS", 5000, "IMPOSSIBLE_TRAVEL", "access same resources", source_ip="81.2.100.5")

async def scenario_d_credential_sharing():
    # eng_07
    yield create_event("eng_07", "auth", "AD_LOGIN", "LOW", "k8s_cluster", "k8s-cluster", "SERVER", "/", "LOGIN", "SUCCESS", 0, "CREDENTIAL_SHARING", "Normal session", source_ip="10.100.10.107")
    await asyncio.sleep(5)
    yield create_event("eng_07", "auth", "AD_LOGIN", "MEDIUM", "jira_internal", "jira.internal", "SERVER", "/", "LOGIN", "SUCCESS", 0, "CREDENTIAL_SHARING", "Second session from different subnet", source_ip="10.100.40.55")
    await asyncio.sleep(5)
    yield create_event("eng_07", "auth", "VPN_CONNECT", "HIGH", "vpn_gateway", "VPN_Gateway_US", "VPN_GATEWAY", "/", "CONNECT", "SUCCESS", 0, "CREDENTIAL_SHARING", "Third session from VPN", source_ip="192.168.1.100")
    await asyncio.sleep(5)
    yield create_event("eng_07", "resource_access", "APP_RESOURCE_ACCESS", "CRITICAL", "k8s_cluster", "k8s-cluster", "SERVER", "/", "ACCESS", "SUCCESS", 5000, "CREDENTIAL_SHARING", "All three active simultaneously doing different tasks", source_ip="10.100.10.107")
    yield create_event("eng_07", "resource_access", "APP_RESOURCE_ACCESS", "CRITICAL", "jira_internal", "jira.internal", "SERVER", "/", "ACCESS", "SUCCESS", 5000, "CREDENTIAL_SHARING", "All three active simultaneously doing different tasks", source_ip="10.100.40.55")
    yield create_event("eng_07", "resource_access", "APP_RESOURCE_ACCESS", "CRITICAL", "s3_builds", "s3://eng-builds", "SERVER", "/", "ACCESS", "SUCCESS", 5000, "CREDENTIAL_SHARING", "All three active simultaneously doing different tasks", source_ip="192.168.1.100")

async def scenario_e_after_hours():
    # fin_05
    yield create_event("fin_05", "auth", "VPN_CONNECT", "MEDIUM", "vpn_gateway", "VPN_Gateway_US", "VPN_GATEWAY", "/", "CONNECT", "SUCCESS", 0, "AFTER_HOURS_HARVEST", "VPN connect at 2AM")
    await asyncio.sleep(2)
    yield create_event("fin_05", "resource_access", "APP_RESOURCE_ACCESS", "HIGH", "erp_finance", "erp-finance.internal", "SERVER", "/", "ACCESS", "SUCCESS", 0, "AFTER_HOURS_HARVEST", "Access erp-finance")
    await asyncio.sleep(2)
    yield create_event("fin_05", "file_system", "FILE_READ", "CRITICAL", "share_finance", "share://finance-quarterly", "SHARE", "/reports/Q1-Q4.pdf", "FILE_READ", "SUCCESS", 500000000, "AFTER_HOURS_HARVEST", "Bulk FILE_READ of quarterly reports")
    await asyncio.sleep(5)
    yield create_event("fin_05", "file_system", "FILE_COPY", "CRITICAL", "ext_share", "share://external-dropbox", "SHARE", "/upload/Q1-Q4.pdf", "FILE_COPY", "SUCCESS", 500000000, "AFTER_HOURS_HARVEST", "FILE_COPY to external share")

SCENARIOS = {
    "A": scenario_a_low_and_slow,
    "B": scenario_b_flight_risk,
    "C": scenario_c_impossible_travel,
    "D": scenario_d_credential_sharing,
    "E": scenario_e_after_hours
}
