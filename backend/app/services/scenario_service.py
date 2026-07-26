"""
Module 11 -- Scenario Simulator.

Applies a rule-based multiplier set to the baseline risk model output to
estimate the effect of a hypothetical event (festival, road closure, VIP
movement, heavy rainfall, officer shortage) on a ward's predicted risk. This
is an interpretable "what-if" layer on top of the real trained model rather
than a separate simulation model -- multipliers are documented and visible in
the response so a commander can see exactly what assumption drove the change.
"""
from __future__ import annotations

from app.services.risk_service import predict_risk

SCENARIOS = {
    "festival": dict(label="Festival Tomorrow", crime_multiplier=1.35, crowd_multiplier=1.6,
                      note="Historical festival-day patterns show elevated theft and crowd-related incidents."),
    "road_closure": dict(label="Road Closure", crime_multiplier=1.1, crowd_multiplier=1.0,
                          note="Reduced patrol mobility and rerouted traffic slightly elevate response-time risk."),
    "vip_movement": dict(label="VIP Movement", crime_multiplier=0.85, crowd_multiplier=1.2,
                          note="Increased visible security presence typically suppresses opportunistic crime near the route."),
    "heavy_rainfall": dict(label="Heavy Rainfall", crime_multiplier=0.9, crowd_multiplier=0.7,
                            note="Lower footfall reduces street crime but raises vehicle-incident risk."),
    "officer_shortage": dict(label="Officer Shortage", crime_multiplier=1.25, crowd_multiplier=1.0,
                              note="Reduced visible patrol presence historically correlates with a moderate uptick in property crime."),
}


def simulate(ward: str, scenario_key: str, hour: int = 21, weekday: int = 4) -> dict:
    if scenario_key not in SCENARIOS:
        raise ValueError(f"Unknown scenario: {scenario_key}")
    baseline = predict_risk(ward, hour, weekday)
    scenario = SCENARIOS[scenario_key]
    adjusted_score = min(100, round(baseline["risk_score"] * scenario["crime_multiplier"], 1))
    adjusted_incidents = round(baseline["expected_incidents"] * scenario["crime_multiplier"], 2)

    return dict(
        ward=ward, scenario=scenario["label"], scenario_key=scenario_key,
        baseline_risk_score=baseline["risk_score"],
        adjusted_risk_score=adjusted_score,
        delta=round(adjusted_score - baseline["risk_score"], 1),
        baseline_expected_incidents=baseline["expected_incidents"],
        adjusted_expected_incidents=adjusted_incidents,
        crime_multiplier=scenario["crime_multiplier"],
        note=scenario["note"],
        recommendation=(
            "Consider pre-positioning an additional patrol unit before the event window."
            if adjusted_score - baseline["risk_score"] > 5 else
            "No additional deployment change indicated beyond standard rostering."
        ),
    )


def list_scenarios() -> list[dict]:
    return [dict(key=k, **v) for k, v in SCENARIOS.items()]
