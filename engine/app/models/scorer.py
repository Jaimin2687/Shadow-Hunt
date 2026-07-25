import numpy as np
from pyod.models.iforest import IForest
from pyod.models.lof import LOF

class AnomalyScorer:
    def __init__(self):
        self.iforest = IForest(n_estimators=100, contamination=0.02, random_state=42)
        self.lof = LOF(n_neighbors=20, contamination=0.02, novelty=True)
        self.is_fitted = False
        self.ecdf_iforest = None
        self.ecdf_lof = None
    
    def fit_baseline(self, X_train: np.ndarray):
        if len(X_train) == 0:
            return
        self.iforest.fit(X_train)
        self.lof.fit(X_train)
        
        train_scores_if = self.iforest.decision_scores_
        train_scores_lof = self.lof.decision_scores_
        
        self.ecdf_iforest = np.sort(train_scores_if)
        self.ecdf_lof = np.sort(train_scores_lof)
        self.is_fitted = True
    
    def score_event(self, feature_vector: np.ndarray) -> dict:
        if not self.is_fitted:
            return {"score_iforest": 0.0, "score_lof": 0.0, "combined_pyod": 0.0}
            
        X = feature_vector.reshape(1, -1)
        
        try:
            s_if = float(self.iforest.decision_function(X)[0])
        except Exception:
            s_if = 0.0
            
        try:
            s_lof = float(self.lof.decision_function(X)[0])
        except Exception:
            s_lof = 0.0
            
        if np.isnan(s_if): s_if = 0.0
        if np.isnan(s_lof): s_lof = 0.0
        
        # Clamp to valid reasonable ranges if needed, but percentiles handle ranking
        s_if = float(np.clip(s_if, -100.0, 100.0))
        s_lof = float(np.clip(s_lof, -100.0, 100.0))
        
        perc_if = np.searchsorted(self.ecdf_iforest, s_if) / max(1, len(self.ecdf_iforest))
        perc_lof = np.searchsorted(self.ecdf_lof, s_lof) / max(1, len(self.ecdf_lof))
        
        combined = float(max(perc_if, perc_lof))
        if np.isnan(combined): combined = 0.0
        
        return {
            "score_iforest": s_if,
            "score_lof": s_lof,
            "combined_pyod": combined
        }
    
    def generate_synthetic_baseline(self, n_samples=500) -> np.ndarray:
        np.random.seed(42)
        
        # 70% normal operational events
        n_normal = int(n_samples * 0.7)
        novelty_n = np.random.uniform(0, 0.15, n_normal)
        temporal_n = np.random.uniform(0, 0.3, n_normal)
        volume_z_n = np.clip(np.random.normal(0.5, 0.5, n_normal), 0, None)
        peer_n = np.random.uniform(0, 0.6, n_normal)  # Real peer deviation goes up to ~0.6
        
        # 30% cold-start / warmup events (near-zero features — must be in baseline!)
        n_warmup = n_samples - n_normal
        novelty_w = np.random.uniform(0, 0.01, n_warmup)
        temporal_w = np.random.uniform(0, 0.02, n_warmup)
        volume_z_w = np.random.uniform(0, 0.05, n_warmup)
        peer_w = np.random.uniform(0, 0.05, n_warmup)
        
        novelty = np.concatenate([novelty_n, novelty_w])
        temporal = np.concatenate([temporal_n, temporal_w])
        volume_z = np.concatenate([volume_z_n, volume_z_w])
        peer = np.concatenate([peer_n, peer_w])
        
        return np.column_stack((novelty, temporal, volume_z, peer))
