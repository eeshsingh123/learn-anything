from enum import Enum
from datetime import datetime

from pydantic import BaseModel, field_validator
from pydantic_core.core_schema import ValidationInfo


class SourceType(str, Enum):
    document = 'document'
    image = 'image'
    audio = 'audio'
    video = 'video'
    link = 'link'


class Subtype(str, Enum):
    pdf = 'pdf'
    docx = 'docx'
    xlsx = 'xlsx'
    pptx = 'pptx'
    note = 'note'
    src = 'src'


class Source(BaseModel):
    source: SourceType
    sourceSubType: Subtype
    name: str
    size: str
    source_content_id: str
    user_id: str
    created_at: datetime

    @field_validator('sourceSubType', mode='after')
    @classmethod
    def validate_subtype(cls, subtype_value: Subtype, info: ValidationInfo) -> Subtype:
        source_value = info.data.get('source')
        if source_value == SourceType.document:
            allowed_subtypes = {
                Subtype.pdf, Subtype.docx, Subtype.xlsx, Subtype.pptx, Subtype.note
            }
            if subtype_value not in allowed_subtypes:
                raise ValueError(f"Invalid subtype '{subtype_value}' for source '{source_value}'")
        elif source_value in [SourceType.audio, SourceType.image, SourceType.video, SourceType.link]:
            allowed_subtypes = {Subtype.src}
            if subtype_value not in allowed_subtypes:
                raise ValueError(f"Invalid subtype '{subtype_value}' for source '{source_value}'")
        return subtype_value
