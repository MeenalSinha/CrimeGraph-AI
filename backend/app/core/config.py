"""
Central configuration for CrimeGraph AI backend.
All values can be overridden with environment variables (see .env.example).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "app" / "data" / "generated"
MODEL_DIR = BASE_DIR / "app" / "ml" / "artifacts"

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)


class Settings:
    PROJECT_NAME: str = "CrimeGraph AI"
    VERSION: str = "0.1.0-prototype"

    SECRET_KEY: str = os.getenv("CRIMEGRAPH_SECRET_KEY", "dev-secret-change-in-production-8f2a1c9d")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8

    CORS_ORIGINS: list = os.getenv("CRIMEGRAPH_CORS_ORIGINS", "http://localhost:3000").split(",")

    # Synthetic city simulated for the demo. Change to re-generate a different city.
    CITY_NAME: str = os.getenv("CRIMEGRAPH_CITY_NAME", "Novagarh")
    SYNTHETIC_SEED: int = int(os.getenv("CRIMEGRAPH_SEED", "42"))
    N_PERSONS: int = int(os.getenv("CRIMEGRAPH_N_PERSONS", "50"))
    N_FIRS: int = int(os.getenv("CRIMEGRAPH_N_FIRS", "200"))
    N_DAYS_HISTORY: int = int(os.getenv("CRIMEGRAPH_N_DAYS", "30"))

    # Optional: if set, the AI chat / investigation copilot will call a real LLM.
    # If unset, the platform falls back to deterministic, graph-grounded template generation
    # (documented in AUDIT.md -- this is intentional so the demo works with zero API keys).
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")


settings = Settings()
