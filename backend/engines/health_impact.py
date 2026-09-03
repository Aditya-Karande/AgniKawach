"""
Health impact engine -- explicitly a rule-based PLACEHOLDER, not a trained
model. Shape is anchored to the cited real-world stat (14.7% mortality
increase after 2 consecutive days above the 97th percentile of local
temperature) -- same shape of relationship, deliberately simplified.

Per heat2health-architecture.md:
    base = max(0, risk - 0.5) * 60
    if consecutive_extreme_days >= 2: base *= 1.3
    range = [base*0.8, base*1.2]
"""

CONSECUTIVE_EXTREME_MULTIPLIER = 1.3
CONSECUTIVE_EXTREME_THRESHOLD = 2
RANGE_LOW_FACTOR = 0.8
RANGE_HIGH_FACTOR = 1.2


def compute_health_impact(risk_score: float, consecutive_extreme_days: int = 0) -> dict:
    base = max(0.0, risk_score - 0.5) * 60
    if consecutive_extreme_days >= CONSECUTIVE_EXTREME_THRESHOLD:
        base *= CONSECUTIVE_EXTREME_MULTIPLIER

    low_pct = round(base * RANGE_LOW_FACTOR, 2)
    high_pct = round(base * RANGE_HIGH_FACTOR, 2)

    return {
        "low_pct": low_pct,
        "high_pct": high_pct,
        "confidence": "low (rule-based placeholder, not a fitted model)",
    }
