import numpy as np
import math
from typing import Tuple

def compute_temporal_entropy(hourly_histogram: np.ndarray, current_hour: int) -> Tuple[float, float]:
    total_count = np.sum(hourly_histogram)
    
    p = (hourly_histogram + 1) / (total_count + 24)
    
    H = -np.sum(p * np.log2(p))
    H_norm = H / math.log2(24)
    
    p_h = p[current_hour]
    
    S_temporal = (1 - p_h) * (1 - H_norm)
    return float(H_norm), float(S_temporal)
