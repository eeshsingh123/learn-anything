from enum import Enum
from datetime import datetime

from pydantic import BaseModel, Field
from typing import List, Optional, Union


class ConversationType(str, Enum):
    editor = 'editor'
    chat = 'chat'


class Conversation(BaseModel):
    name: str
    overview: Optional[Union[str, None]] = None
    workspace_id: str
    user_id: str
    source_ids: List[str] = Field(..., description="List of source IDs associated with this conversation", default_factory=[])
    history: List[dict] = Field(..., description="Overall conversation history, may or may not be summarized based on length", default_factory=[])
    usage: dict = Field(..., description="LLM usage stats for this conversation", default_factory={})
    conversation_type: str = ConversationType
    created_at: datetime