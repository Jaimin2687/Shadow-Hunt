import numpy as np
import math

def compute_peer_suppression(user_features: np.ndarray, peer_centroid: np.ndarray, gamma: float = 0.5) -> float:
    if peer_centroid is None or len(peer_centroid) == 0:
        return 1.0
    min_len = min(len(user_features), len(peer_centroid))
    deviation = np.linalg.norm(user_features[:min_len] - peer_centroid[:min_len])
    return 1 - math.exp(-gamma * deviation)

class PeerGroupManager:
    def __init__(self, alpha: float = 0.1):
        self.centroids = {}
        self.alpha = alpha
        
    def update_and_get_centroid(self, department: str, user_features: np.ndarray) -> np.ndarray:
        if department not in self.centroids:
            self.centroids[department] = user_features.copy()
            return self.centroids[department]
            
        current = self.centroids[department]
        self.centroids[department] = self.alpha * user_features + (1 - self.alpha) * current
        return self.centroids[department]
