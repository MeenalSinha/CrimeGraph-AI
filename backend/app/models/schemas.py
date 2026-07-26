from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    username: str
    password: str


class PredictionRequest(BaseModel):
    ward: str
    hour: int = Field(default=21, ge=0, le=23)
    weekday: int = Field(default=4, ge=0, le=6)
    weather: str = "Clear"
    is_festival_day: bool = False

    @field_validator("ward")
    @classmethod
    def ward_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ward must not be blank")
        return v.strip()


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class ScenarioRequest(BaseModel):
    ward: str
    scenario_key: str
    hour: int = Field(default=21, ge=0, le=23)
    weekday: int = Field(default=4, ge=0, le=6)


class ShortestPathRequest(BaseModel):
    source: str = Field(min_length=1)
    target: str = Field(min_length=1)


class PatrolRequest(BaseModel):
    n_units: int | None = Field(default=None, ge=1, le=100)
