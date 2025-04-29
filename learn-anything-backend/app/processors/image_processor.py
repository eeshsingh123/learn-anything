import base64
import mimetypes
from typing import Dict, List
from pydantic import BaseModel

from google import genai
from google.genai import types

from ..core.config import GEMINI_API_KEY
from .base import FileProcessor


# Response mode for Image generation
class TableStructure(BaseModel):
    columns: List[str]
    rows: List[List[str]]

class ImageResponse(BaseModel):
    text: str
    tables: List[TableStructure]
    description: str
    type: str



class ImageProcessor(FileProcessor):

    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    async def process(self, content: bytes, filename: str) -> Dict:
        try:
            if not GEMINI_API_KEY:
                return {"filename": filename, "error": "Google API key is missing"}

            # Encode image as base64
            image_b64 = base64.b64encode(content).decode("utf-8")
            mime_type, _ = mimetypes.guess_type(filename)
            mime_type = mime_type or "image/jpeg"

            # Prepare prompt for Gemini
            prompt = (
                "Analyze this image and extract all relevant information in JSON format. Include: "
                "1. Any text (via OCR) in a 'text' field. If a table is detected, include it only in the 'tables' field and keep the text empty. "
                "3. Classify the image as: document, infographic, timetable, invoice, or the category you feel it belongs to. "
                "4. Any tables, formatted as an array of objects with 'columns' (array of strings) and 'rows' (array of arrays of strings). "
                "5. A detailed scene description in a 'description' field. "
                "DO NOT mention the word json in your response."
            )

            # Process with Gemini
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[
                        types.Part.from_bytes(
                            data=image_b64,
                            mime_type=mime_type,
                        ),
                        prompt
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ImageResponse
                    )
                )

                llm_response = response.parsed
            except Exception as e:
                return {"filename": filename, "error": f"Gemini processing failed: {str(e)}"}

            # Store image and LLM response
            pages = [{
                "page_number": 1,
                "image": image_b64,
                **llm_response.model_dump(exclude_unset=True)
            }]

            return {
                "filename": filename,
                "pages": pages,
                "page_count": 1
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process image: {str(e)}"}