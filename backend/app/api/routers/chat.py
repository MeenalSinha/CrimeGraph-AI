from fastapi import APIRouter

from app.models.schemas import ChatRequest
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/ask")
def ask(body: ChatRequest):
    return chat_service.answer(body.query)
