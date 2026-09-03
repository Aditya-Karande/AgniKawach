"""
Alerts engine -- template-based alert text generation per audience.
Pure function: (ward_name, day_label, risk_payload) -> text.
"""

AUDIENCES = ("citizen", "hospital", "municipality")


def _citizen_text(ward_name: str, day_label: str, band: str, wbgt: float, actions: list[str]) -> str:
    tips = {
        "Extreme": "Avoid going outdoors between 12pm-4pm. Drink water often, even if not thirsty. Check on elderly neighbours.",
        "High": "Limit time outdoors during peak afternoon heat. Carry water and stay in shade when possible.",
        "Moderate": "Stay hydrated and take breaks in shade if you're outdoors for long periods.",
        "Low": "No special precautions needed today.",
    }.get(band, "Stay hydrated and watch for heat symptoms.")
    return (
        f"Heat Advisory -- {ward_name} ({day_label})\n"
        f"Risk level: {band}. Heat stress index (WBGT): {wbgt} deg C.\n"
        f"{tips}"
    )


def _hospital_text(ward_name: str, day_label: str, band: str, health_impact: dict, actions: list[str]) -> str:
    return (
        f"Heat-Health Alert for Facilities -- {ward_name} ({day_label})\n"
        f"Risk level: {band}. Estimated heat-attributable admission increase: "
        f"{health_impact['low_pct']}-{health_impact['high_pct']}% "
        f"(confidence: {health_impact['confidence']}).\n"
        f"Recommended: {actions[2] if len(actions) > 2 else actions[0]}"
    )


def _municipality_text(ward_name: str, day_label: str, band: str, dominant_driver: str, actions: list[str]) -> str:
    action_lines = "\n".join(f"- {a}" for a in actions)
    return (
        f"Ward Risk Briefing -- {ward_name} ({day_label})\n"
        f"Risk level: {band}. Dominant vulnerability driver: {dominant_driver}.\n"
        f"Recommended actions:\n{action_lines}"
    )


def generate_alert(audience: str, ward_name: str, day_label: str, risk_payload: dict) -> str:
    band = risk_payload["risk"]["band"]
    wbgt = risk_payload["hazard"]["wbgt"]
    actions = risk_payload["actions"]
    dominant_driver = risk_payload["vulnerability"]["dominant_driver"]
    health_impact = risk_payload["health_impact"]

    if audience == "citizen":
        return _citizen_text(ward_name, day_label, band, wbgt, actions)
    if audience == "hospital":
        return _hospital_text(ward_name, day_label, band, health_impact, actions)
    if audience == "municipality":
        return _municipality_text(ward_name, day_label, band, dominant_driver, actions)
    raise ValueError(f"Unknown audience: {audience}")
