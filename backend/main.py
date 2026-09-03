"""
AagniShield backend -- FastAPI app.

Routes are thin wrappers around pure functions in engines/*.py, per the
API contract in heat2health-architecture.md. Each engine is independently
testable / whiteboard-able.
"""
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from engines import alerts, decision, health_impact, microclimate, risk, thermal, vulnerability, weather

app = FastAPI(title="AagniShield API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo scope only -- tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "data" / "wards.json"
RISK_BAND_EXTREME_THRESHOLD = 0.75


def _load_wards() -> list[dict]:
    with open(DATA_PATH, "r") as f:
        raw = json.load(f)
    return raw["wards"]


WARDS = _load_wards()
WARDS_BY_ID = {w["id"]: w for w in WARDS}
VULNERABILITY_BOUNDS = vulnerability.build_normalization_bounds(WARDS)


def _get_ward_or_404(ward_id: str) -> dict:
    ward = WARDS_BY_ID.get(ward_id)
    if ward is None:
        raise HTTPException(status_code=404, detail=f"Unknown ward_id '{ward_id}'")
    return ward


async def _compute_risk_payload(ward: dict, day: int) -> dict:
    forecast = await weather.fetch_forecast(ward["lat"], ward["lon"], ward["id"])
    if day < 0 or day >= len(forecast):
        raise HTTPException(status_code=400, detail=f"day must be between 0 and {len(forecast) - 1}")

    # vulnerability is ward-level, not day-dependent
    vuln = vulnerability.compute_vulnerability(ward, VULNERABILITY_BOUNDS)

    # urban-heat-island offset is also ward-level, not day-dependent -- it
    # accounts for the fact that Open-Meteo's forecast grid (~9-11km) is
    # coarser than the spacing between our wards, so the raw met forecast
    # alone can't tell dense, low-green-cover wards apart from leafier ones
    uhi = microclimate.compute_uhi_offset(ward)

    # walk backwards from `day` counting consecutive days at/above the
    # Extreme risk threshold, to feed the health-impact multiplier
    consecutive_extreme_days = 0
    for i in range(day, -1, -1):
        day_forecast = forecast[i]
        day_hazard = thermal.compute_thermal(day_forecast["temp_c"] + uhi, day_forecast["rh_pct"])
        day_risk = risk.compute_risk(day_hazard["score"], vuln["score"])
        if day_risk["score"] >= RISK_BAND_EXTREME_THRESHOLD:
            consecutive_extreme_days += 1
        else:
            break

    today_forecast = forecast[day]
    local_temp_c = round(today_forecast["temp_c"] + uhi, 1)
    hazard = thermal.compute_thermal(local_temp_c, today_forecast["rh_pct"])
    hazard["uhi_offset_c"] = uhi
    hazard["local_temp_c"] = local_temp_c
    risk_result = risk.compute_risk(hazard["score"], vuln["score"])
    impact = health_impact.compute_health_impact(risk_result["score"], consecutive_extreme_days)
    actions = decision.decide_actions(risk_result["band"], vuln["dominant_driver_field"])

    explanation = [
        f"Forecast (day {day}, {today_forecast['date']}): "
        f"{today_forecast['temp_c']}\u00b0C, {today_forecast['rh_pct']}% RH "
        f"[{today_forecast['source']}]",
        f"Local microclimate adjustment: {'+' if uhi >= 0 else ''}{uhi}\u00b0C "
        f"(density/informal-housing/green-cover offset) -> {local_temp_c}\u00b0C",
        f"Thermal hazard: WBGT {hazard['wbgt']}\u00b0C -> hazard score {hazard['score']} "
        f"(0-1 scale over 20-34\u00b0C WBGT band)",
        f"Vulnerability: {vuln['score']} -- dominant driver is {vuln['dominant_driver']} "
        f"(raw value: {next(c['raw_value'] for c in vuln['components'] if c['field'] == vuln['dominant_driver_field'])})",
        f"Risk = 0.5 \u00d7 {hazard['score']} (hazard) + 0.5 \u00d7 {vuln['score']} (vulnerability) "
        f"= {risk_result['score']} -> {risk_result['band']}",
    ]
    if consecutive_extreme_days >= 2:
        explanation.append(
            f"{consecutive_extreme_days} consecutive Extreme-risk days detected -> "
            f"health-impact estimate scaled \u00d71.3"
        )
    explanation.append(
        f"Health impact estimate: {impact['low_pct']}-{impact['high_pct']}% "
        f"(placeholder, confidence: {impact['confidence']})"
    )

    return {
        "ward_id": ward["id"],
        "day": day,
        "date": today_forecast["date"],
        "hazard": hazard,
        "vulnerability": vuln,
        "risk": risk_result,
        "health_impact": impact,
        "actions": actions,
        "explanation": explanation,
        "consecutive_extreme_days": consecutive_extreme_days,
    }


@app.get("/api/wards")
def get_wards():
    """Ward metadata only -- no risk calc. Includes verified/estimated source tags."""
    return WARDS


@app.get("/api/forecast/{ward_id}")
async def get_forecast(ward_id: str):
    ward = _get_ward_or_404(ward_id)
    forecast = await weather.fetch_forecast(ward["lat"], ward["lon"], ward["id"])
    return forecast


@app.get("/api/risk/{ward_id}")
async def get_risk(ward_id: str, day: int = Query(0, ge=0, le=4)):
    ward = _get_ward_or_404(ward_id)
    return await _compute_risk_payload(ward, day)


@app.get("/api/risk-all")
async def get_risk_all(day: int = Query(0, ge=0, le=4)):
    """Not in the original contract, but the map/list need every ward's risk
    for a given day in one shot rather than N waterfalled requests."""
    results = []
    for ward in WARDS:
        payload = await _compute_risk_payload(ward, day)
        results.append(payload)
    return results


@app.get("/api/alert/{ward_id}")
async def get_alert(
    ward_id: str,
    day: int = Query(0, ge=0, le=4),
    audience: str = Query(..., pattern="^(citizen|hospital|municipality)$"),
):
    ward = _get_ward_or_404(ward_id)
    risk_payload = await _compute_risk_payload(ward, day)
    day_label = f"Day {day} ({risk_payload['date']})"
    text = alerts.generate_alert(audience, ward["name"], day_label, risk_payload)
    return {"text": text}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "wards_loaded": len(WARDS)}
