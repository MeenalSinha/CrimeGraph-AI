from fastapi import APIRouter

from app.models.schemas import PatrolRequest
from app.services import patrol_service

router = APIRouter(prefix="/api/patrol", tags=["patrol"])


@router.post("/optimize")
def optimize(body: PatrolRequest):
    return patrol_service.optimize_patrols(body.n_units)


@router.get("/optimize")
def optimize_default():
    return patrol_service.optimize_patrols()


@router.post("/optimize-advanced")
def optimize_advanced(body: PatrolRequest):
    """Real constrained optimization via Google OR-Tools (multi-depot VRP with
    risk-weighted coverage penalties). Slower (~2-3s) than the heuristic
    endpoint above but produces genuinely solver-optimized routes -- see
    AUDIT.md for a measured comparison of both strategies."""
    return patrol_service.optimize_patrols_ortools(body.n_units)


@router.get("/optimize-advanced")
def optimize_advanced_default():
    return patrol_service.optimize_patrols_ortools()
