import numpy as np
from typing import Dict, Any

class ForestDensityAnalyzer:
    def __init__(self, non_veg: float = 0.20, sparse: float = 0.40, moderate: float = 0.60):
        self.non_veg = non_veg
        self.sparse = sparse
        self.moderate = moderate

    def classify_density(self, ndvi_matrix: np.ndarray) -> np.ndarray:
        """
        Classifies pixels:
        0 = Non-vegetation
        1 = Sparse vegetation
        2 = Moderate vegetation
        3 = Dense vegetation
        """
        classified = np.zeros(ndvi_matrix.shape, dtype=int)
        classified[(ndvi_matrix >= self.non_veg) & (ndvi_matrix < self.sparse)] = 1
        classified[(ndvi_matrix >= self.sparse) & (ndvi_matrix < self.moderate)] = 2
        classified[ndvi_matrix >= self.moderate] = 3
        return classified

    def calculate_density_stats(self, ndvi_matrix: np.ndarray) -> Dict[str, float]:
        total = ndvi_matrix.size
        if total == 0:
            return {"non_veg_pct": 0, "sparse_pct": 0, "moderate_pct": 0, "dense_pct": 0}
        
        non_veg_count = np.sum(ndvi_matrix < self.non_veg)
        sparse_count = np.sum((ndvi_matrix >= self.non_veg) & (ndvi_matrix < self.sparse))
        moderate_count = np.sum((ndvi_matrix >= self.sparse) & (ndvi_matrix < self.moderate))
        dense_count = np.sum(ndvi_matrix >= self.moderate)

        return {
            "non_veg_pct": round(float(non_veg_count / total) * 100, 2),
            "sparse_pct": round(float(sparse_count / total) * 100, 2),
            "moderate_pct": round(float(moderate_count / total) * 100, 2),
            "dense_pct": round(float(dense_count / total) * 100, 2),
        }

density_analyzer = ForestDensityAnalyzer()
