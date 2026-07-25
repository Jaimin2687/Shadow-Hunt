from dataclasses import dataclass, field
import numpy as np
from typing import Set, Dict, List, Tuple

@dataclass
class UserBehaviorWindow:
    user_id: str
    department: str
    access_set: Set[str] = field(default_factory=set)
    hourly_histogram: np.ndarray = field(default_factory=lambda: np.zeros(24, dtype=np.int32))
    volume_buffer: np.ndarray = field(default_factory=lambda: np.zeros((30, 4), dtype=np.float32))
    buffer_head: int = 0
    buffer_count: int = 0
    event_count: int = 0
    session_ips: Dict[str, Set[str]] = field(default_factory=dict)
    last_login_locations: List[Tuple[str, float]] = field(default_factory=list)
    ewma_mean: np.ndarray = field(default_factory=lambda: np.zeros(4, dtype=np.float32))
    ewma_var: np.ndarray = field(default_factory=lambda: np.zeros(4, dtype=np.float32))

    def add_volume_event(self, metric_vector: np.ndarray):
        self.volume_buffer[self.buffer_head] = metric_vector
        self.buffer_head = (self.buffer_head + 1) % 30
        self.buffer_count = min(30, self.buffer_count + 1)

    def get_rolling_stats(self):
        if self.buffer_count == 0:
            return np.zeros(4), np.zeros(4)
        valid_data = self.volume_buffer[:self.buffer_count] if self.buffer_count < 30 else self.volume_buffer
        return np.mean(valid_data, axis=0), np.std(valid_data, axis=0)

    def update_ewma(self, x: np.ndarray, alpha: float = 0.065):
        if self.buffer_count == 0:
            self.ewma_mean = x.copy()
            self.ewma_var = np.zeros_like(x)
        else:
            diff = x - self.ewma_mean
            self.ewma_mean = alpha * x + (1 - alpha) * self.ewma_mean
            self.ewma_var = (1 - alpha) * (self.ewma_var + alpha * (diff ** 2))
