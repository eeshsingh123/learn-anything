from datetime import datetime

from pydantic import BaseModel


class Workspace(BaseModel):
    name: str
    user_id: str
    created_at: datetime
