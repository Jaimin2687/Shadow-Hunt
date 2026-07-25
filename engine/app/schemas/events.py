from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class ActorInfo(BaseModel):
    user_id: str
    username: str
    department: str
    role: str
    source_ip: str
    device_id: Optional[str] = None

class TargetInfo(BaseModel):
    resource_id: str
    resource_name: str
    resource_type: str
    file_path: Optional[str] = None

class ActionInfo(BaseModel):
    operation: str
    status: str
    bytes_transferred: int = 0
    session_id: Optional[str] = None

class GroundTruth(BaseModel):
    is_attack: bool = False
    scenario_id: Optional[str] = None
    attack_phase: Optional[str] = None

class TelemetryEvent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    event_id: str
    timestamp: str
    event_category: str
    event_type: str
    severity: str = 'INFORMATIONAL'
    actor: ActorInfo
    target: TargetInfo
    action: ActionInfo
    ground_truth: GroundTruth = GroundTruth()
    t0_ns: Optional[int] = Field(default=None, alias='_t0_ns')

class AnomalyBreakdown(BaseModel):
    novelty_score: float
    temporal_anomaly: float
    volume_max_z: float
    pyod_percentile: float
    peer_deviation: float

class AnomalyResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    user_id: str
    risk_score: float
    is_anomaly: bool
    severity: str
    breakdown: AnomalyBreakdown
    recommended_action: str
    t0_ns: Optional[int] = Field(default=None, alias='_t0_ns')
