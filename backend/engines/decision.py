"""
Decision engine.

Not fully pinned down by formula in the architecture doc, so this is a
transparent rule table: risk band sets the baseline action set, the
vulnerability's dominant driver adds one targeted action on top. Pure
function -> easy to extend or swap for a real playbook later.
"""

BASE_ACTIONS = {
    "Extreme": [
        "Activate ward-level heat emergency response",
        "Open all designated cooling centres and extend hours",
        "Suspend outdoor labour and construction during 12pm-4pm",
        "Deploy ASHA/health workers for door-to-door checks in high-risk pockets",
    ],
    "High": [
        "Issue public heat advisory for the ward",
        "Open cooling centres during peak hours",
        "Alert local hospitals and PHCs to expect heat-related admissions",
        "Push hydration and shade reminders via local channels",
    ],
    "Moderate": [
        "Monitor conditions through the day",
        "Share heat safety reminders with vulnerable groups",
        "Ensure drinking water points are stocked and accessible",
    ],
    "Low": [
        "No special action required",
        "Continue routine monitoring",
    ],
}

DRIVER_ACTIONS = {
    "elderly_pct": "Prioritise wellness checks for elderly residents",
    "outdoor_worker_pct": "Coordinate with employers to shift outdoor work to cooler hours",
    "density_per_km2": "Pre-position medical supplies given high population density",
    "green_cover_pct": "Flag ward for temporary shade/misting infrastructure given low green cover",
    "informal_housing_pct": "Prioritise informal settlement pockets -- poor housing insulation raises indoor heat exposure",
}


def decide_actions(band: str, dominant_driver_field: str) -> list[str]:
    actions = list(BASE_ACTIONS.get(band, BASE_ACTIONS["Low"]))
    if band in ("Extreme", "High", "Moderate"):
        driver_action = DRIVER_ACTIONS.get(dominant_driver_field)
        if driver_action:
            actions.append(driver_action)
    return actions
