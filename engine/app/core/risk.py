import math

def aggregate_risk_score(novelty: float, temporal: float, volume_z: float, pyod_score: float, alpha: float = 0.65) -> float:
    # NaN Guards
    novelty = 0.0 if math.isnan(novelty) else novelty
    temporal = 0.0 if math.isnan(temporal) else temporal
    volume_z = 0.0 if math.isnan(volume_z) else volume_z
    pyod_score = 0.0 if math.isnan(pyod_score) else pyod_score

    # Sigmoid-normalize volume z-score (3σ = 50%, 5σ = 88%, 10σ = 99.9%)
    volume_norm = 1 / (1 + math.exp(-(volume_z - 3)))
    
    # BEHAVIORAL SCORE: These are the primary signals (novelty, temporal, volume)
    # These MUST be elevated for risk to be high.
    behavioral_scores = [novelty, temporal, volume_norm]
    behavioral_weights = [0.35, 0.25, 0.40]
    behavioral = sum(w * s for w, s in zip(behavioral_weights, behavioral_scores))
    behavioral_max = max(behavioral_scores)
    
    # Blend max-component with weighted average for behavioral
    behavior_signal = alpha * behavioral_max + (1 - alpha) * behavioral
    
    # PyOD acts as an AMPLIFIER, not a standalone score.
    # High PyOD + high behavioral = very high risk (attack confirmed by ML)
    # High PyOD + low behavioral = low risk (ML noise, ignore)
    # Low PyOD + high behavioral = moderate risk (novel pattern, still flag)
    pyod_boost = 1.0 + pyod_score * 0.5  # Range: 1.0 to 1.5
    
    raw = behavior_signal * pyod_boost
    return min(100.0, raw * 100.0)

def get_severity(score: float) -> str:
    if score >= 85: return 'CRITICAL'
    if score >= 70: return 'HIGH'
    if score >= 50: return 'MEDIUM'
    if score >= 30: return 'LOW'
    return 'INFORMATIONAL'

def get_recommended_action(score: float, breakdown: dict) -> str:
    if score >= 85: return 'ISOLATE_ACCOUNT'
    if score >= 70: return 'REVOKE_SESSION'
    if score >= 50: return 'FLAG_AUDIT'
    if score >= 30: return 'STEP_UP_AUTH'
    return 'MONITOR'
