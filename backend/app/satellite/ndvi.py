import numpy as np
from typing import Dict, Any, Tuple

class NDVICalculator:
    @staticmethod
    def calculate_ndvi_matrix(b04: np.ndarray, b08: np.ndarray) -> np.ndarray:
        """
        Calculates NDVI = (B08 - B04) / (B08 + B04)
        Clips output to [-1.0, 1.0].
        """
        denominator = b08 + b04
        # Avoid division by zero
        denominator = np.where(denominator == 0, 1e-6, denominator)
        ndvi = (b08 - b04) / denominator
        return np.clip(ndvi, -1.0, 1.0)

    @staticmethod
    def calculate_metrics(ndvi_matrix: np.ndarray, non_veg_threshold: float = 0.20) -> Dict[str, float]:
        """
        Calculates statistical summary of an NDVI matrix.
        """
        min_val = float(np.min(ndvi_matrix))
        max_val = float(np.max(ndvi_matrix))
        mean_val = float(np.mean(ndvi_matrix))
        median_val = float(np.median(ndvi_matrix))
        
        veg_pixels = np.sum(ndvi_matrix >= non_veg_threshold)
        total_pixels = ndvi_matrix.size
        veg_pct = float((veg_pixels / total_pixels) * 100.0) if total_pixels > 0 else 0.0
        
        return {
            "min_ndvi": round(min_val, 4),
            "max_ndvi": round(max_val, 4),
            "mean_ndvi": round(mean_val, 4),
            "median_ndvi": round(median_val, 4),
            "vegetation_coverage_pct": round(veg_pct, 2)
        }

ndvi_calculator = NDVICalculator()
