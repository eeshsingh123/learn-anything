from enum import Enum
from datetime import datetime

from pydantic import BaseModel
from typing import List, Dict, Optional


class Subtype(str, Enum):
    pdf = 'pdf'
    doc = 'doc'
    docx = 'docx'
    ppt = 'ppt'
    pptx = 'pptx'
    xlsx = 'xlsx'
    xls = 'xls'
    csv='csv'
    txt= 'txt'
    url = 'url'
    discovered = 'discovered'
    drive = 'drive'
    mp3 = 'mp3'
    wav = 'wav'
    mp4 = 'mp4'
    jpg = 'jpg'
    jpeg = 'jpeg'
    png = 'png'


class Source(BaseModel):
    user_id: str
    workspace_id: str
    name: str
    type: Subtype
    size: float
    page_count: int
    pages: List[Dict]
    usage: Optional[Dict] = {}
    batch_id: Optional[str] = None
    created_at: datetime

