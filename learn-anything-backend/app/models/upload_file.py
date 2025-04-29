from pydantic import BaseModel, field_validator
from fastapi import UploadFile
from typing import List, Optional, Union
import mimetypes

from ..core.config import ALLOWED_FILE_TYPES


class FileInput(BaseModel):
    files: List[UploadFile]
    urls: Optional[List[Union[str, None]]] = None

    @field_validator("files")
    @classmethod
    def validate_file_types(cls, files: List[UploadFile]) -> List[UploadFile]:
        for file in files:
            mime_type, _ = mimetypes.guess_type(file.filename)
            if not mime_type or mime_type not in ALLOWED_FILE_TYPES:
                raise ValueError(f"Unsupported file type for {file.filename}")
        return files
