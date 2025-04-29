from typing import Dict

from .base import FileProcessor


class TextProcessor(FileProcessor):
    async def process(self, content: bytes, filename: str) -> Dict:
        try:
            text = content.decode("utf-8")
            # Split text into pages (e.g., every 500 characters)
            chunk_size = 500
            pages = []
            for i in range(0, len(text), chunk_size):
                pages.append({
                    "page_number": len(pages) + 1,
                    "text": text[i:i + chunk_size],
                    "tables": [],
                    "images": []
                })
            return {
                "filename": filename,
                "pages": pages,
                "page_count": len(pages)
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process TXT: {str(e)}"}