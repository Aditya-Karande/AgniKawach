"""
Microclimate engine.

Open-Meteo's forecast grid is roughly 9-11km resolution. AagniShield's 8
demo wards sit close enough together (Mumbai city limits) that the raw
grid forecast is often near-identical or literally identical across wards,
even though street-level heat varies a lot ward to ward -- this is the
"urban heat island" (UHI) effect, and it's well documented for Mumbai:
dense, heavily-paved, low-green-cover areas run hotter than leafier,
lower-density ones at the same time of day.

This engine adds a small, deterministic, ward-specific offset (degrees C)
on top of the raw met forecast before it feeds the thermal hazard (WBGT)
calculation, so wards actually differentiate on heat, not just on
vulnerability.

Like the vulnerability weights in vulnerability.py, the coefficients below
are a stated starting point, NOT empirically calibrated against real
sensor data -- surface this as "confidence: low" / an estimate if a judge
asks, same as the health-impact engine.
"""

DENSITY_REF_PER_KM2 = 50_000  # density at/above this is treated as "maximal" crowding
DENSITY_MAX_C = 0.9           # up to +0.9°C from density/waste-heat/reduced airflow
INFORMAL_MAX_C = 0.5          # up to +0.5°C from heat-retaining materials/low ventilation
GREEN_MAX_C = 1.4             # up to -1.4°C cooling from shade + evapotranspiration

OFFSET_FLOOR_C = -1.0
OFFSET_CEIL_C = 2.0


def compute_uhi_offset(ward: dict) -> float:
    """Deterministic urban-heat-island offset (°C) for a single ward."""
    density = ward.get("density_per_km2") or 0
    informal_pct = ward.get("informal_housing_pct") or 0
    green_pct = ward.get("green_cover_pct") or 0

    density_component = min(density / DENSITY_REF_PER_KM2, 1.0) * DENSITY_MAX_C
    informal_component = (informal_pct / 100) * INFORMAL_MAX_C
    green_component = (green_pct / 100) * GREEN_MAX_C

    offset = density_component + informal_component - green_component
    return round(max(OFFSET_FLOOR_C, min(OFFSET_CEIL_C, offset)), 2)


def apply_uhi_offset(ward: dict, temp_c: float) -> dict:
    """Convenience wrapper: returns the offset and the adjusted local temp."""
    offset_c = compute_uhi_offset(ward)
    return {
        "uhi_offset_c": offset_c,
        "local_temp_c": round(temp_c + offset_c, 1),
    }
