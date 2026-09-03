"""
Thermal stress engine.

Implements the Australian Bureau of Meteorology WBGT approximation, exactly
as specified in heat2health-architecture.md:

    e = (RH/100) * 6.105 * exp(17.27*T / (237.7+T))
    WBGT = 0.567*T + 0.393*e + 3.94
    hazard_score = clamp((WBGT - 20) / (34 - 20), 0, 1)

Kept as pure functions -> easy to unit test and whiteboard.
"""
import math

WBGT_FLOOR = 20.0   # below this, hazard_score = 0
WBGT_CEIL = 34.0    # at/above this, hazard_score = 1


def compute_vapour_pressure(temp_c: float, rh_pct: float) -> float:
    """Actual vapour pressure e (hPa/kPa-equivalent per BOM formula)."""
    return (rh_pct / 100.0) * 6.105 * math.exp((17.27 * temp_c) / (237.7 + temp_c))


def compute_wbgt(temp_c: float, rh_pct: float) -> float:
    """Simplified outdoor WBGT approximation (Australian BOM method)."""
    e = compute_vapour_pressure(temp_c, rh_pct)
    wbgt = 0.567 * temp_c + 0.393 * e + 3.94
    return round(wbgt, 2)


def compute_hazard_score(wbgt: float) -> float:
    """Clamp WBGT into a 0-1 hazard score over the [20, 34] deg C band."""
    score = (wbgt - WBGT_FLOOR) / (WBGT_CEIL - WBGT_FLOOR)
    return round(max(0.0, min(1.0, score)), 4)


def compute_thermal(temp_c: float, rh_pct: float) -> dict:
    """Convenience wrapper returning the full hazard payload."""
    wbgt = compute_wbgt(temp_c, rh_pct)
    score = compute_hazard_score(wbgt)
    return {"wbgt": wbgt, "score": score}
