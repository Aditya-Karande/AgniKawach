"""
Risk engine.

Per heat2health-architecture.md:
    risk = 0.5*hazard_score + 0.5*vulnerability
    band = Extreme (>=0.75) | High (>=0.55) | Moderate (>=0.35) | Low
"""

HAZARD_WEIGHT = 0.5
VULNERABILITY_WEIGHT = 0.5

BAND_THRESHOLDS = [
    ("Extreme", 0.75),
    ("High", 0.55),
    ("Moderate", 0.35),
]
DEFAULT_BAND = "Low"

BAND_ORDER = ["Low", "Moderate", "High", "Extreme"]


def compute_risk_band(risk_score: float) -> str:
    for band, threshold in BAND_THRESHOLDS:
        if risk_score >= threshold:
            return band
    return DEFAULT_BAND


def compute_risk(hazard_score: float, vulnerability_score: float) -> dict:
    score = round(HAZARD_WEIGHT * hazard_score + VULNERABILITY_WEIGHT * vulnerability_score, 4)
    score = max(0.0, min(1.0, score))
    band = compute_risk_band(score)
    return {"score": score, "band": band}
