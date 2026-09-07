import numpy as np
from typing import Dict, Any, Tuple

class ChangeDetector:
    def calculate_ndvi_difference(
        self, ndvi_previous: np.ndarray, ndvi_current: np.ndarray
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        NDVI_change = ndvi_current - ndvi_previous
        Negative values indicate vegetation decline.
        """
        diff = ndvi_current - ndvi_previous
        
        # Classification thresholds
        critical_mask = diff <= -0.40
        high_mask = (diff > -0.40) & (diff <= -0.25)
        mod_mask = (diff > -0.25) & (diff <= -0.10)
        low_mask = (diff > -0.10) & (diff < 0.0)
        stable_mask = diff >= 0.0

        total = diff.size
        stats = {
            "mean_change": round(float(np.mean(diff)), 4),
            "max_drop": round(float(np.min(diff)), 4),
            "critical_pct": round(float(np.sum(critical_mask) / total) * 100, 2),
            "high_pct": round(float(np.sum(high_mask) / total) * 100, 2),
            "moderate_pct": round(float(np.sum(mod_mask) / total) * 100, 2),
            "low_pct": round(float(np.sum(low_mask) / total) * 100, 2),
            "stable_pct": round(float(np.sum(stable_mask) / total) * 100, 2),
        }

        return diff, stats

change_detector = ChangeDetector()
