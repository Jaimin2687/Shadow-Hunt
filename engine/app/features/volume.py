import numpy as np
import math
from typing import Tuple

def compute_volume_zscore(current_volumes: np.ndarray, ewma_mean: np.ndarray, ewma_var: np.ndarray, alpha: float = 0.065) -> Tuple[float, np.ndarray, np.ndarray]:
    MIN_VAR = 0.01  # Floor to prevent z-score explosion during cold start
    diff = current_volumes - ewma_mean
    safe_var = np.maximum(ewma_var, MIN_VAR)
    z_scores = np.maximum(0, diff / np.sqrt(safe_var))
    # Cap individual z-scores at 20 sigma
    z_scores = np.minimum(z_scores, 20.0)
    max_z = float(np.max(z_scores))
    
    new_mean = alpha * current_volumes + (1 - alpha) * ewma_mean
    new_var = (1 - alpha) * (ewma_var + alpha * (diff ** 2))
    
    return max_z, new_mean, new_var

class StreamingVolumeTracker:
    def __init__(self, alpha: float = 0.065):
        self.alpha = alpha
        self.mean = 0.0
        self.var = 0.0
        self.count = 0
        
    def update_and_score(self, x: float) -> float:
        if self.count == 0:
            self.mean = x
            self.var = 0.0
            self.count += 1
            return 0.0
            
        epsilon = 1e-7
        diff = x - self.mean
        z_score = max(0, diff / (math.sqrt(max(0.0, self.var)) + epsilon))
        
        self.mean = self.alpha * x + (1 - self.alpha) * self.mean
        self.var = (1 - self.alpha) * (self.var + self.alpha * (diff ** 2))
        self.count += 1
        
        return z_score
