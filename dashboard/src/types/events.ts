export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  event_category: 'auth' | 'file_system' | 'network' | 'resource_access';
  event_type: string;
  severity: 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actor: { user_id: string; username: string; department: string; role: string; source_ip: string; device_id?: string };
  target: { resource_id: string; resource_name: string; resource_type: string; file_path?: string };
  action: { operation: string; status: string; bytes_transferred?: number; session_id?: string };
  ground_truth: { is_attack: boolean; scenario_id?: string | null; attack_phase?: string | null };
  _t0_ns?: number;
}

export interface UserRiskState {
  user_id: string;
  username: string;
  department: string;
  role: string;
  current_risk: number;
  peak_risk: number;
  risk_history: number[];
  anomaly_count: number;
  last_event_time: number;
  is_isolated: boolean;
  active_alerts: Alert[];
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: string;
  message: string;
  scenario_id?: string;
  acknowledged: boolean;
}

export interface WSMessage {
  type: 'log_event' | 'risk_update' | 'alert' | 'soar_action' | 'system';
  payload: any;
  timestamp: string;
  _t0_ns?: number;
}

export interface AnomalyBreakdown {
  novelty_score: number;
  temporal_anomaly: number;
  volume_max_z: number;
  pyod_percentile: number;
  peer_deviation?: number;
}
