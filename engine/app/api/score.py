from fastapi import APIRouter, HTTPException
from typing import List
import asyncio
import datetime
import math
import numpy as np
from app.core.logger import logger

from app.schemas.events import TelemetryEvent, AnomalyResponse, AnomalyBreakdown
from app.models.state import UserBehaviorWindow
from app.features.novelty import compute_access_novelty
from app.features.temporal import compute_temporal_entropy
from app.features.volume import compute_volume_zscore
from app.features.peer_group import compute_peer_suppression
from app.core.risk import aggregate_risk_score, get_severity, get_recommended_action

logger = logging.getLogger("shadow-hunt.engine")

router = APIRouter()

# Warm-up period: dampen scores for users with very few events
WARMUP_EVENTS = 5
MAX_USERS = 500
EVICTION_TTL_SEC = 86400

def prune_stale_users(user_states):
    if len(user_states) >= MAX_USERS:
        now = datetime.datetime.now(datetime.timezone.utc).timestamp()
        sorted_users = sorted(user_states.items(), key=lambda item: item[1].last_event_time)
        evicted = 0
        for uid, state in sorted_users:
            if len(user_states) <= MAX_USERS * 0.8:
                break
            if now - state.last_event_time > EVICTION_TTL_SEC or len(user_states) >= MAX_USERS:
                del user_states[uid]
                evicted += 1
        if evicted > 0:
            logger.info("Evicted stale users", extra={"context": {"evicted_count": evicted, "remaining_users": len(user_states)}})

@router.post("/score", response_model=AnomalyResponse)
async def score_event(event: TelemetryEvent):
    from app.main import USER_STATES, SCORER, PEER_MANAGER, RESOURCE_FREQ

    user_id = event.actor.user_id
    dept = event.actor.department

    # --- Get or create user state ---
    if user_id not in USER_STATES:
        prune_stale_users(USER_STATES)
        USER_STATES[user_id] = UserBehaviorWindow(user_id=user_id, department=dept)
    state = USER_STATES[user_id]
    state.event_count += 1
    state.last_event_time = datetime.datetime.now(datetime.timezone.utc).timestamp()
    warmup_factor = min(1.0, state.event_count / WARMUP_EVENTS)

    # --- 1. Access Novelty ---
    res_id = event.target.resource_id
    RESOURCE_FREQ[res_id] = RESOURCE_FREQ.get(res_id, 0) + 1
    curr_res = {res_id}
    raw_novelty = compute_access_novelty(
        state.access_set, curr_res, RESOURCE_FREQ, max(1, len(USER_STATES))
    )
    novelty = float(np.clip(raw_novelty * warmup_factor, 0.0, 1.0))
    state.access_set.add(res_id)

    # --- 2. Temporal Entropy & Time Delta ---
    try:
        dt = datetime.datetime.fromisoformat(event.timestamp.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        dt = datetime.datetime.now(datetime.timezone.utc)
        
    t_current = dt.timestamp()
    t_previous = state.last_event_time if state.last_event_time > 0 else t_current - 1
    
    time_delta = t_current - t_previous
    if time_delta <= 0:
        time_delta = 1.0  # Prevent Divide-by-Zero
        
    decay_factor = 1.0 / time_delta
    
    hour = dt.hour
    state.hourly_histogram[hour] += 1
    _, raw_temporal = compute_temporal_entropy(state.hourly_histogram, hour)
    temporal_score = float(np.clip(raw_temporal * warmup_factor, 0.0, 1.0))

    # --- 3. Volume Z-Score ---
    bytes_mb = (event.action.bytes_transferred or 0) / (1024 * 1024)  # Normalize to MB
    v = np.zeros(4, dtype=np.float32)
    v[3] = bytes_mb
    op = (event.action.operation or "").lower()
    if "read" in op:
        v[0] += 1
    elif "copy" in op:
        v[1] += 1
    elif "delete" in op:
        v[2] += 1

    state.add_volume_event(v)

    if state.buffer_count <= 3:
        # Bootstrap phase: need >=3 events before z-scores are meaningful
        state.update_ewma(v)
        max_z = 0.0
    else:
        max_z, state.ewma_mean, state.ewma_var = compute_volume_zscore(
            v, state.ewma_mean, state.ewma_var, alpha=0.065
        )
        max_z = float(np.clip(max_z * warmup_factor, 0.0, 20.0))  # Dampen + cap

    # --- 4. Session & IP Tracking ---
    session_id = event.action.session_id
    source_ip = event.actor.source_ip
    if session_id and source_ip:
        if session_id not in state.session_ips:
            state.session_ips[session_id] = set()
        state.session_ips[session_id].add(source_ip)

    # Track login locations for impossible travel
    if event.event_type in ("AD_LOGIN", "VPN_CONNECT"):
        ts = dt.timestamp()
        state.last_login_locations.append((source_ip, ts))
        # Keep only last 10 logins
        if len(state.last_login_locations) > 10:
            state.last_login_locations = state.last_login_locations[-10:]

    # --- 5. Peer Group Suppression ---
    feature_vec_3d = np.array([novelty, temporal_score, max_z], dtype=np.float64)
    peer_centroid = PEER_MANAGER.centroids.get(dept, None)
    if peer_centroid is None:
        # First user in this department: they ARE the baseline, deviation = 0
        peer_suppression = 0.0
    else:
        peer_suppression = compute_peer_suppression(feature_vec_3d, peer_centroid)
    PEER_MANAGER.update_and_get_centroid(dept, feature_vec_3d)

    # --- 6. PyOD Scoring (async) ---
    feature_vec_4d = np.array([novelty, temporal_score, max_z, peer_suppression], dtype=np.float64)
    pyod_res = await asyncio.to_thread(SCORER.score_event, feature_vec_4d)
    pyod_percentile = float(np.clip(pyod_res["combined_pyod"], 0.0, 1.0))

    # --- 7. Final Risk Aggregation ---
    risk_score = aggregate_risk_score(novelty, temporal_score, max_z, pyod_percentile)
    
    if math.isnan(risk_score) or math.isinf(risk_score):
        risk_score = state.previous_score # Fallback safely
        
    risk_score = float(np.clip(risk_score, 0.0, 100.0))
    risk_score = min(risk_score, 100.0) # Clamp Maximum Risk
    state.previous_score = risk_score

    # Apply peer suppression: reduce score if behavior matches department baseline
    if peer_suppression < 0.3 and risk_score < 70:
        risk_score *= (0.7 + peer_suppression)  # Suppress up to 30% for normal peers
        risk_score = max(0.0, risk_score)

    severity = get_severity(risk_score)
    is_anomaly = risk_score >= 50

    breakdown = AnomalyBreakdown(
        novelty_score=round(novelty, 4),
        temporal_anomaly=round(temporal_score, 4),
        volume_max_z=round(max_z, 4),
        pyod_percentile=round(pyod_percentile, 4),
        peer_deviation=round(peer_suppression, 4),
    )

    rec_action = get_recommended_action(risk_score, breakdown.model_dump())

    return AnomalyResponse(
        user_id=user_id,
        risk_score=round(risk_score, 2),
        is_anomaly=is_anomaly,
        severity=severity,
        breakdown=breakdown,
        recommended_action=rec_action,
        t0_ns=event.t0_ns,
    )


@router.post("/batch", response_model=List[AnomalyResponse])
async def score_batch(events: List[TelemetryEvent]):
    results = []
    for e in events:
        results.append(await score_event(e))
    return results


@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    from app.main import USER_STATES
    if user_id not in USER_STATES:
        raise HTTPException(status_code=404, detail="User not found")
    state = USER_STATES[user_id]
    return {
        "user_id": state.user_id,
        "department": state.department,
        "event_count": state.event_count,
        "total_resources_accessed": len(state.access_set),
        "hourly_distribution": state.hourly_histogram.tolist(),
        "concurrent_sessions": {
            sid: list(ips) for sid, ips in state.session_ips.items() if len(ips) > 1
        },
        "recent_logins": state.last_login_locations[-5:],
    }


@router.get("/health")
async def health_check():
    from app.main import USER_STATES, SCORER
    return {
        "status": "ok",
        "model_fitted": SCORER.is_fitted,
        "active_users": len(USER_STATES),
    }
