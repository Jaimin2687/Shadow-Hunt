import math
from typing import Set, Dict

def compute_access_novelty(historical_resources: Set[str], current_resources: Set[str], global_resource_freq: Dict[str, int], total_users: int) -> float:
    new_resources = current_resources - historical_resources
    if not current_resources:
        return 0.0
    
    epsilon = 1e-5
    def w(r):
        freq = global_resource_freq.get(r, 0)
        return max(0, -math.log2(min(1.0, freq / max(1, total_users)) + epsilon))
        
    num = sum(w(r) for r in new_resources)
    den = sum(w(r) for r in current_resources)
    if den == 0:
        return 0.0
    return num / den
