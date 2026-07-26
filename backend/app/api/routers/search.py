from fastapi import APIRouter

from app.services.search_service import global_search

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/")
def search(q: str):
    return dict(results=global_search(q))
