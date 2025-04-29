from datetime import datetime

from pydantic import BaseModel, Field
from typing import List, Union


class Agent(BaseModel):
    name: str
    description: str
    workspace_id: str
    user_id: str
    conversation_ids: List[str] = Field(..., description="This Agent has taken part in which conversations, more convs more versatile", default_factory=[])
    persona: Union[str, None] = Field(..., description="How has the agent adapted to the user independently", default=None)
    system_instructions: Union[str, None] = Field(..., description="Agent specific instructions to follow", default=None)
    created_at: datetime
