"""
Synthetic Data Generator (Module 17)

Generates a complete, internally-consistent fake city -- persons, vehicles, phones,
bank accounts, police stations, wards/locations, FIRs (crime records), phone-call
logs, financial transfers, and person-to-person associations (including gang
clusters seeded on purpose so community detection has something real to find).

Everything is fictional. Names, phone numbers, and locations are Faker-generated
and any resemblance to real people or places is coincidental. This lets the whole
platform be demoed and evaluated without touching sensitive real-world police data.

Run standalone:  python -m app.data.synthetic_generator
"""
from __future__ import annotations

import json
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from faker import Faker

from app.core.config import settings, DATA_DIR

CRIME_TYPES = [
    "Theft", "Burglary", "Assault", "Robbery", "Vehicle Theft",
    "Fraud", "Narcotics", "Extortion", "Cybercrime", "Kidnapping",
]

# Base relative frequency + a severity band per crime type, used to bias generation.
CRIME_PROFILE = {
    "Theft":          dict(weight=22, severity=(1, 3)),
    "Burglary":       dict(weight=14, severity=(2, 4)),
    "Assault":        dict(weight=15, severity=(2, 5)),
    "Robbery":        dict(weight=9,  severity=(3, 5)),
    "Vehicle Theft":  dict(weight=11, severity=(1, 3)),
    "Fraud":          dict(weight=10, severity=(1, 3)),
    "Narcotics":      dict(weight=8,  severity=(2, 4)),
    "Extortion":      dict(weight=4,  severity=(3, 5)),
    "Cybercrime":     dict(weight=5,  severity=(1, 3)),
    "Kidnapping":     dict(weight=2,  severity=(4, 5)),
}

WARDS = [
    ("North District", 26.92, 75.82, 1.15),
    ("Central Zone", 26.90, 75.80, 1.45),
    ("West Sector", 26.895, 75.775, 1.0),
    ("South Division", 26.87, 75.79, 0.9),
    ("East Ward", 26.905, 75.83, 1.2),
    ("Old City", 26.915, 75.805, 1.35),
    ("Riverside", 26.88, 75.81, 0.75),
    ("Industrial Belt", 26.86, 75.77, 0.85),
]

# Static population density per ward (people / sq km) -- a real Module 1 input
# ("population density") the earlier pass omitted; correlates loosely with the
# ward risk weight above but is deliberately not identical, since dense-but-
# orderly districts and sparse-but-high-crime industrial belts both exist.
WARD_POPULATION_DENSITY = {
    "North District": 8200, "Central Zone": 14500, "West Sector": 9100,
    "South Division": 6400, "East Ward": 10800, "Old City": 16200,
    "Riverside": 5200, "Industrial Belt": 3100,
}

WEATHER_TYPES = ["Clear", "Cloudy", "Rain", "Fog", "Heatwave"]
WEATHER_WEIGHTS = [45, 25, 15, 10, 5]

# A fixed festival calendar (day-of-year) for the demo city -- a real Module 1
# input ("festival calendar"). Festival days bias crime generation upward
# (crowds -> theft/pickpocketing) exactly like the Scenario Simulator's
# "festival" what-if assumes, so the two features are consistent with each other.
FESTIVAL_DAYS_OF_YEAR = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]

# Per-ward crime-type character (multiplier on the base weight above). This
# gives the crime-type classifier genuine learnable signal instead of a
# near-uniform citywide distribution -- real cities have districts with
# distinct crime profiles (a financial district sees more fraud/cybercrime,
# an industrial/low-income area sees more narcotics and burglary), and this
# was the honestly-flagged weak point in an earlier pass (crime-type ROC AUC
# ~0.5, essentially random -- see AUDIT.md). Multipliers below are a design
# choice, not calibrated to any real jurisdiction's actual crime statistics.
WARD_CRIME_CHARACTER = {
    "North District":  {"Theft": 1.1, "Vehicle Theft": 1.2},
    "Central Zone":     {"Fraud": 2.2, "Cybercrime": 2.4, "Extortion": 1.4},
    "West Sector":      {"Theft": 1.3, "Vehicle Theft": 1.1},
    "South Division":   {"Assault": 1.2, "Theft": 1.0},
    "East Ward":        {"Burglary": 1.5, "Robbery": 1.3},
    "Old City":         {"Theft": 1.6, "Burglary": 1.3, "Extortion": 1.3},
    "Riverside":        {"Narcotics": 1.4, "Kidnapping": 1.3},
    "Industrial Belt":  {"Narcotics": 2.3, "Burglary": 1.6, "Robbery": 1.4},
}

# Time-of-day character: certain crime types cluster strongly at night vs day.
NIGHT_CRIME_MULTIPLIER = {
    "Burglary": 2.0, "Robbery": 1.8, "Assault": 1.5, "Narcotics": 1.6, "Kidnapping": 1.4,
}
DAY_CRIME_MULTIPLIER = {
    "Fraud": 1.8, "Cybercrime": 1.7, "Theft": 1.2,
}

WEAPON_TYPES = ["None", "Knife", "Firearm", "Blunt Object", "Improvised"]
GANG_NAMES = ["Kaal Chakra", "Iron Serpents", "Red Falcon", "Shadow Circuit", "Bhairav Network"]


def _weighted_choice(rng: random.Random, profile: dict) -> str:
    types = list(profile.keys())
    weights = [profile[t]["weight"] for t in types]
    return rng.choices(types, weights=weights, k=1)[0]


class SyntheticCityGenerator:
    def __init__(self, seed: int = settings.SYNTHETIC_SEED):
        self.seed = seed
        self.rng = random.Random(seed)
        self.np_rng = np.random.default_rng(seed)
        self.fake = Faker()
        Faker.seed(seed)

    # ---------- Reference entities ----------

    def gen_police_stations(self) -> pd.DataFrame:
        rows = []
        for i, (ward, lat, lng, _risk) in enumerate(WARDS):
            rows.append(dict(
                station_id=f"PS-{i+1:03d}",
                name=f"{ward} Police Station",
                ward=ward,
                lat=lat + self.rng.uniform(-0.004, 0.004),
                lng=lng + self.rng.uniform(-0.004, 0.004),
                officer_count=self.rng.randint(18, 55),
                vehicle_count=self.rng.randint(3, 10),
            ))
        return pd.DataFrame(rows)

    def gen_persons(self, n: int) -> pd.DataFrame:
        rows = []
        for i in range(n):
            is_poi = self.rng.random() < 0.35  # person of interest / prior record
            ward = self.rng.choice(WARDS)[0]
            rows.append(dict(
                person_id=f"P-{i+1:05d}",
                name=self.fake.name(),
                age=self.rng.randint(17, 65),
                gender=self.rng.choice(["M", "F"]),
                ward=ward,
                aliases=", ".join(self.fake.first_name() for _ in range(self.rng.randint(0, 2))),
                is_person_of_interest=is_poi,
                risk_score=round(self.rng.betavariate(2, 5) * (1.6 if is_poi else 0.6), 3),
                gang_affiliation=self.rng.choice(GANG_NAMES) if is_poi and self.rng.random() < 0.4 else "",
            ))
        return pd.DataFrame(rows)

    def gen_vehicles(self, persons: pd.DataFrame) -> pd.DataFrame:
        rows = []
        owners = persons.sample(frac=0.7, random_state=self.seed)
        for i, (_, p) in enumerate(owners.iterrows()):
            rows.append(dict(
                vehicle_id=f"V-{i+1:05d}",
                plate=f"{self.rng.choice(['RJ','DL','UP','MH'])}{self.rng.randint(10,99)}"
                      f"{self.rng.choice('ABCDEFGH')}{self.rng.randint(1000,9999)}",
                type=self.rng.choice(["Motorcycle", "Sedan", "SUV", "Auto-rickshaw", "Truck"]),
                owner_id=p["person_id"],
            ))
        return pd.DataFrame(rows)

    def gen_phones(self, persons: pd.DataFrame) -> pd.DataFrame:
        rows = []
        for i, (_, p) in enumerate(persons.iterrows()):
            n_numbers = self.rng.choice([1, 1, 1, 2])
            for j in range(n_numbers):
                rows.append(dict(
                    phone_id=f"PH-{len(rows)+1:05d}",
                    number=f"+91-{self.rng.randint(70000,99999)}{self.rng.randint(10000,99999)}",
                    owner_id=p["person_id"],
                ))
        return pd.DataFrame(rows)

    def gen_accounts(self, persons: pd.DataFrame) -> pd.DataFrame:
        rows = []
        holders = persons.sample(frac=0.6, random_state=self.seed + 1)
        for i, (_, p) in enumerate(holders.iterrows()):
            rows.append(dict(
                account_id=f"AC-{i+1:05d}",
                bank=self.rng.choice(["StateTrust Bank", "Novagarh Co-op", "Unity Financial", "Metro Bank"]),
                owner_id=p["person_id"],
            ))
        return pd.DataFrame(rows)

    # ---------- Events / relationships ----------

    def gen_calls(self, phones: pd.DataFrame, persons: pd.DataFrame, n: int) -> pd.DataFrame:
        poi_ids = persons[persons.is_person_of_interest]["person_id"].tolist()
        rows = []
        start = datetime.now() - timedelta(days=settings.N_DAYS_HISTORY)
        for i in range(n):
            # Bias: persons of interest call each other more than random chance would suggest,
            # which is what makes community detection later on meaningful rather than noise.
            if self.rng.random() < 0.4 and len(poi_ids) > 2:
                a, b = self.rng.sample(poi_ids, 2)
            else:
                a, b = self.rng.sample(persons["person_id"].tolist(), 2)
            ts = start + timedelta(seconds=self.rng.randint(0, settings.N_DAYS_HISTORY * 86400))
            rows.append(dict(
                call_id=f"CALL-{i+1:06d}",
                caller_id=a,
                callee_id=b,
                timestamp=ts.isoformat(),
                duration_sec=self.rng.randint(5, 1800),
            ))
        return pd.DataFrame(rows)

    def gen_transfers(self, accounts: pd.DataFrame, n: int) -> pd.DataFrame:
        rows = []
        start = datetime.now() - timedelta(days=settings.N_DAYS_HISTORY)
        ids = accounts["account_id"].tolist()
        if len(ids) < 2:
            return pd.DataFrame(rows)
        for i in range(n):
            a, b = self.rng.sample(ids, 2)
            ts = start + timedelta(seconds=self.rng.randint(0, settings.N_DAYS_HISTORY * 86400))
            rows.append(dict(
                transfer_id=f"TXN-{i+1:06d}",
                from_account=a,
                to_account=b,
                amount=round(self.rng.uniform(500, 250000), 2),
                timestamp=ts.isoformat(),
            ))
        return pd.DataFrame(rows)

    def gen_firs(self, persons: pd.DataFrame, stations: pd.DataFrame, n: int) -> pd.DataFrame:
        rows = []
        start = datetime.now() - timedelta(days=settings.N_DAYS_HISTORY)
        ward_coords = {w[0]: (w[1], w[2]) for w in WARDS}
        suspects_pool = persons[persons.is_person_of_interest]["person_id"].tolist()

        for i in range(n):
            ward = self.rng.choices(
                [w[0] for w in WARDS],
                weights=[w[3] for w in WARDS],
                k=1,
            )[0]

            day_offset = self.rng.randint(0, settings.N_DAYS_HISTORY - 1)
            ts = start + timedelta(days=day_offset,
                                    hours=self.rng.randint(0, 23),
                                    minutes=self.rng.randint(0, 59))
            day_of_year = ts.timetuple().tm_yday
            is_festival_day = 1 if day_of_year in FESTIVAL_DAYS_OF_YEAR else 0
            weather = self.rng.choices(WEATHER_TYPES, weights=WEATHER_WEIGHTS, k=1)[0]
            is_night_flag = ts.hour >= 20 or ts.hour <= 4

            # Ward character and time-of-day are the dominant signal (this is
            # what a real trained classifier should be able to pick up on);
            # festival/weather are secondary modifiers on top of that.
            profile = dict(CRIME_PROFILE)
            ward_character = WARD_CRIME_CHARACTER.get(ward, {})
            for crime_type, mult in ward_character.items():
                profile[crime_type] = dict(profile[crime_type], weight=profile[crime_type]["weight"] * mult)
            time_mults = NIGHT_CRIME_MULTIPLIER if is_night_flag else DAY_CRIME_MULTIPLIER
            for crime_type, mult in time_mults.items():
                profile[crime_type] = dict(profile[crime_type], weight=profile[crime_type]["weight"] * mult)
            if is_festival_day:
                profile = {k: dict(v, weight=v["weight"] * (2.4 if k in ("Theft", "Fraud") else 1.15))
                           for k, v in profile.items()}
            if weather in ("Rain", "Fog", "Heatwave"):
                profile = {k: dict(v, weight=v["weight"] * (0.6 if k in ("Theft", "Robbery", "Assault") else 1.05))
                           for k, v in profile.items()}

            crime = _weighted_choice(self.rng, profile)
            sev_lo, sev_hi = CRIME_PROFILE[crime]["severity"]
            severity = self.rng.randint(sev_lo, sev_hi)

            # Seasonal / temporal bias: more property crime at night, more assault on weekends.
            is_night = 1 if ts.hour >= 20 or ts.hour <= 4 else 0
            is_weekend = 1 if ts.weekday() >= 5 else 0

            lat0, lng0 = ward_coords[ward]
            lat = lat0 + self.rng.uniform(-0.012, 0.012)
            lng = lng0 + self.rng.uniform(-0.012, 0.012)

            has_suspect = self.rng.random() < 0.55
            suspect_id = self.rng.choice(suspects_pool) if has_suspect and suspects_pool else ""

            rows.append(dict(
                fir_id=f"FIR-{i+1:06d}",
                crime_type=crime,
                severity=severity,
                ward=ward,
                lat=round(lat, 6),
                lng=round(lng, 6),
                timestamp=ts.isoformat(),
                hour=ts.hour,
                weekday=ts.weekday(),
                is_night=is_night,
                is_weekend=is_weekend,
                is_festival_day=is_festival_day,
                weather=weather,
                population_density=WARD_POPULATION_DENSITY[ward],
                weapon=self.rng.choice(WEAPON_TYPES) if crime in
                    ("Assault", "Robbery", "Extortion", "Kidnapping") else "None",
                suspect_id=suspect_id,
                station_id=stations.iloc[self.rng.randrange(len(stations))]["station_id"],
                status=self.rng.choices(
                    ["Under Investigation", "Closed", "Chargesheet Filed", "Cold"],
                    weights=[45, 25, 20, 10], k=1)[0],
            ))
        return pd.DataFrame(rows)

    def gen_associations(self, persons: pd.DataFrame) -> pd.DataFrame:
        """Explicit known-associate edges layered on top of call/transfer graphs,
        seeded so that gang-affiliated persons cluster together for community detection."""
        rows = []
        by_gang: dict[str, list[str]] = {}
        for _, p in persons[persons.gang_affiliation != ""].iterrows():
            by_gang.setdefault(p["gang_affiliation"], []).append(p["person_id"])
        for gang, members in by_gang.items():
            for i in range(len(members)):
                for j in range(i + 1, len(members)):
                    if self.rng.random() < 0.35:
                        rows.append(dict(person_a=members[i], person_b=members[j],
                                          relation="associate", context=gang))
        # sprinkle some random weak-tie associations for noise
        ids = persons["person_id"].tolist()
        for _ in range(min(300, len(ids) * 2)):
            a, b = self.rng.sample(ids, 2)
            rows.append(dict(person_a=a, person_b=b, relation="known_contact", context=""))
        return pd.DataFrame(rows)

    # ---------- Orchestration ----------

    def generate_all(self) -> dict:
        stations = self.gen_police_stations()
        persons = self.gen_persons(settings.N_PERSONS)
        vehicles = self.gen_vehicles(persons)
        phones = self.gen_phones(persons)
        accounts = self.gen_accounts(persons)
        firs = self.gen_firs(persons, stations, settings.N_FIRS)
        calls = self.gen_calls(phones, persons, n=min(6000, settings.N_PERSONS * 8))
        transfers = self.gen_transfers(accounts, n=min(1500, settings.N_PERSONS * 2))
        associations = self.gen_associations(persons)

        data = dict(
            stations=stations, persons=persons, vehicles=vehicles, phones=phones,
            accounts=accounts, firs=firs, calls=calls, transfers=transfers,
            associations=associations,
        )
        return data

    def save(self, data: dict) -> None:
        for name, df in data.items():
            df.to_csv(DATA_DIR / f"{name}.csv", index=False)
        meta = dict(
            city=settings.CITY_NAME,
            generated_at=datetime.now().isoformat(),
            seed=self.seed,
            counts={k: len(v) for k, v in data.items()},
            wards=[w[0] for w in WARDS],
        )
        with open(DATA_DIR / "meta.json", "w") as f:
            json.dump(meta, f, indent=2)


def generate_and_save(seed: int | None = None) -> dict:
    gen = SyntheticCityGenerator(seed=seed or settings.SYNTHETIC_SEED)
    data = gen.generate_all()
    gen.save(data)
    return data


if __name__ == "__main__":
    d = generate_and_save()
    for k, v in d.items():
        print(f"{k:15s} {len(v):6d} rows")
