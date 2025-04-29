import io
from typing import Dict
import pandas as pd

from .base import FileProcessor


class CSVProcessor(FileProcessor):
    @staticmethod
    def process_chunk(chunk: pd.DataFrame) -> Dict:
        columns = chunk.columns.tolist()
        rows = chunk.to_dict(orient="records")
        return {
            "columns": columns,
            "rows": rows
        }

    async def process(self, content: bytes, filename: str) -> Dict:
        try:
            buffer = io.BytesIO(content)
            chunk_size = 1000  # Reduced chunk size for better memory usage
            pages = []
            page_counter = 1

            # Stream CSV in chunks
            for chunk in pd.read_csv(buffer, chunksize=chunk_size):
                result = self.process_chunk(chunk)
                pages.append({
                    "page_number": page_counter,
                    "text": "",
                    "tables": [result],
                    "images": []
                })
                page_counter += 1

            return {
                "filename": filename,
                "pages": pages,
                "page_count": len(pages)
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process CSV: {str(e)}"}
