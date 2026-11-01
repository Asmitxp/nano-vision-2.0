from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    role: str # "user" or "assistant" or "system"
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    project_id: Optional[int] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    context_applied: bool = False
    project_title: Optional[str] = None
    stats_summary: Optional[Dict[str, Any]] = None

