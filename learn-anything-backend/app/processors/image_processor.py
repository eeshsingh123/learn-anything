import json
import base64
import mimetypes
from typing import Dict

from google import genai
from google.genai import types

from ..core.config import GEMINI_API_KEY
from .base import FileProcessor


class ImageProcessor(FileProcessor):

    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    async def process(self, content: bytes, filename: str) -> Dict:
        try:
            if not GEMINI_API_KEY:
                return {"filename": filename, "error": "Google API key is missing"}

            # Encode image as base64
            image_b64 = base64.b64encode(content)
            mime_type, _ = mimetypes.guess_type(filename)
            mime_type = mime_type or "image/jpeg"

            # Prepare prompt for Gemini
            prompt = (
                "Analyze this image and extract all relevant information in JSON format. Include: "
                "1. Any text (via OCR) in a 'text' field. If a table is detected, include it only in the 'tables' field and keep the text empty. "
                "3. Classify the image as: document, infographic, timetable, invoice, or the category you feel it belongs to. "
                "4. Any tables, formatted as an array of objects with 'columns' (array of strings) and 'rows' (array of arrays of strings). "
                "5. Objects or people detected in an 'objects' field (array of strings). "
                "6. A detailed scene description in a 'description' field. "
                "7. Dominant colors in a 'colors' field (array of strings). "
                "8. Image dimensions in 'width' and 'height' fields (in pixels, if available). "
                "Return a JSON object with these fields."
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
                )

                llm_response = response.text
                # Parse JSON if response is a string
                if isinstance(llm_response, str):
                    try:
                        llm_response = json.loads(llm_response)
                    except json.JSONDecodeError:
                        llm_response = {"description": llm_response, "text": "", "tables": [], "objects": [], "colors": []}
            except Exception as e:
                return {"filename": filename, "error": f"Gemini processing failed: {str(e)}"}

            # Validate and format tables
            tables = llm_response.get("tables", [])
            formatted_tables = []
            for table in tables:
                if isinstance(table, dict) and "columns" in table and "rows" in table:
                    formatted_tables.append({
                        "columns": table["columns"],
                        "rows": table["rows"]
                    })
                else:
                    continue  # Skip invalid tables

            # Store image and LLM response
            pages = [{
                "page_number": 1,
                "text": llm_response.get("text", ""),
                "tables": formatted_tables,
                "images": [{
                    "format": mime_type.split("/")[-1],
                    "data": image_b64.decode("utf-8"),  # converting to a string before saving to mongodb
                    "width": llm_response.get("width", None),
                    "height": llm_response.get("height", None)
                }],
                "llm_data": llm_response  # Store full LLM response
            }]

            return {
                "filename": filename,
                "pages": pages,
                "page_count": 1
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process image: {str(e)}"}