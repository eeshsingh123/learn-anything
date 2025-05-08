from datetime import datetime

from pydantic import BaseModel


class UserTelemetry(BaseModel):
    user_id: str
    workspaces_created: int
    sources_uploaded: int
    storage_used: float
    streak: int
    largest_streak: int
    discover_queries_made: int
    created_at: datetime