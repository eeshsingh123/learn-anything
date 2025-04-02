from datetime import datetime
from typing import Union

from pydantic import BaseModel


class User(BaseModel):
    user_id: str
    preference_id: Union[str, None] = None
    name: str
    email: str
    created_at: datetime