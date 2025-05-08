import base64
import mimetypes
from typing import Dict, List
from pydantic import BaseModel

from google import genai
from google.genai import types
from .base import FileProcessor
from ..core.config import GEMINI_API_KEY


class VideoResponse(BaseModel):
    transcript: str
    summary: str
    key_moments: List[Dict[str, str]]  # List of dictionaries with 'timestamp' and 'description'


class VideoProcessor(FileProcessor):
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    async def process(self, content: bytes, filename: str) -> Dict:
        try:
            if not GEMINI_API_KEY:
                return {"filename": filename, "error": "Google API key is missing"}

            # Encode video as base64
            video_b64 = base64.b64encode(content).decode("utf-8")
            mime_type, _ = mimetypes.guess_type(filename)
            mime_type = mime_type or "video/mp4"

            # Prepare prompt for Gemini
            prompt = (
                "Analyze this video and extract key information in JSON format. Include: "
                "1. A brief description of the video in a 'text' field. "
                "2. A list of key moments (notable events or timestamps) in a 'key_moments' field, each with 'timestamp' (in seconds) and 'description'. "
                "Return a JSON object with these fields."
            )

            try:
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[
                        types.Part.from_bytes(
                            data=video_b64,
                            mime_type=mime_type,
                        ),
                        prompt
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=VideoResponse
                    )
                )
                llm_response = response.parsed
            except Exception as e:
                return {"filename": filename, "error": f"Gemini processing failed: {str(e)}"}

            # Store LLM response
            pages = [{
                "page_number": 1,
                **llm_response.model_dump(exclude_unset=True)
            }]

            return {
                "filename": filename,
                "pages": pages,
                "page_count": 1
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process video: {str(e)}"}