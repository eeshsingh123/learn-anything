from datetime import datetime

from pydantic import BaseModel
from typing import List


class SourceContent(BaseModel):
    data: List[dict]
    metadata: dict
    user_id: str
    created_at: datetime
