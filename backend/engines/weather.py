"""
Weather engine.

Calls Open-Meteo server-side (avoids CORS, lets us cache/log, keeps the
frontend dumb). Aggregates hourly -> daily by taking the hour of daily peak
temperature (the hour that actually drives thermal stress), and its
matching relative humidity + wind speed.

If Open-Meteo is unreachable, falls back to a DETERMINISTIC mock (seeded by
ward id + day index) so the demo never breaks live, and repeated calls for
the same ward/day return the same numbers.
"""
import hashlib
from datetime import date, timedelta

import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
FORECAST_DAYS = 5
REQUEST_TIMEOUT = 6.0


def _deterministic_mock(ward_id: str, num_days: int = FORECAST_DAYS) -> list[dict]:
    """Seeded fallback so the demo is stable even offline."""
    days = []
    today = date.today()
    for i in range(num_days):
        seed = f"{ward_id}-{i}".encode()
        h = int(hashlib.sha256(seed).hexdigest(), 16)
        temp_c = round(30.0 + (h % 900) / 100.0, 1)          # 30.0 - 39.0
        rh_pct = round(45.0 + ((h // 1000) % 3500) / 100.0, 1)  # 45 - 80
        wind_kmh = round(6.0 + ((h // 1_000_000) % 1400) / 100.0, 1)  # 6 - 20
        days.append({
            "date": (today + timedelta(days=i)).isoformat(),
            "temp_c": temp_c,
            "rh_pct": rh_pct,
            "wind_kmh": wind_kmh,
            "source": "mock",
        })
    return days


def _aggregate_hourly_to_daily(times, temps, rhs, winds, num_days: int) -> list[dict]:
    by_date = {}
    for t_str, temp, rh, wind in zip(times, temps, rhs, winds):
        d = t_str.split("T")[0]
        by_date.setdefault(d, []).append((temp, rh, wind))

    days = []
    for d in sorted(by_date.keys())[:num_days]:
        rows = by_date[d]
        # peak-heat hour: the hour with the highest temperature drives thermal stress
        peak_temp, peak_rh, peak_wind = max(rows, key=lambda r: r[0])
        days.append({
            "date": d,
            "temp_c": round(peak_temp, 1),
            "rh_pct": round(peak_rh, 1),
            "wind_kmh": round(peak_wind, 1),
            "source": "open-meteo",
        })
    return days


async def fetch_forecast(lat: float, lon: float, ward_id: str, num_days: int = FORECAST_DAYS) -> list[dict]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m",
        "forecast_days": num_days,
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        hourly = data["hourly"]
        return _aggregate_hourly_to_daily(
            hourly["time"], hourly["temperature_2m"],
            hourly["relative_humidity_2m"], hourly["wind_speed_10m"],
            num_days,
        )
    except Exception:
        return _deterministic_mock(ward_id, num_days)
