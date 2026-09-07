"""
PUSHPA Central Risk Scoring Configuration.
Defines immutable/configurable weights, thresholds, and versioning for risk scoring.
All weights must sum exactly to 100.
"""

from typing import Dict, Any

RULESET_VERSION: str = "v1.0"

# Centralized Factor Weights (Sum = 100)
RISK_WEIGHTS: Dict[str, int] = {
    "forest_change": 30,
    "vegetation_loss": 20,
    "permit_anomaly": 20,
    "route_anomaly": 15,
    "historical_risk": 10,
    "spatial_proximity": 5,
}

# Verify at load time that weights sum to exactly 100
TOTAL_MAX_SCORE = sum(RISK_WEIGHTS.values())
assert TOTAL_MAX_SCORE == 100, f"Risk weights must sum to 100, got {TOTAL_MAX_SCORE}"

# Route Risk Rules based on route_anomaly max weight (15)
ROUTE_RISK_RULES: Dict[str, int] = {
    "on_corridor": 0,
    "minor_deviation": int(RISK_WEIGHTS["route_anomaly"] * 0.45),      # 6
    "major_deviation": int(RISK_WEIGHTS["route_anomaly"] * 0.80),      # 12
    "destination_mismatch": RISK_WEIGHTS["route_anomaly"],              # 15
    "unknown_route": int(RISK_WEIGHTS["route_anomaly"] * 0.20)         # 3
}

# Severity Classification Thresholds
RISK_LEVEL_THRESHOLDS = {
    "CRITICAL": 85,
    "VERY HIGH": 70,
    "HIGH": 50,
    "MODERATE": 30,
    "LOW": 0
}
