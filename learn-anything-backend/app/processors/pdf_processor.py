import io
import base64
from typing import Dict

import fitz  # PyMuPDF
import pdfplumber


from .base import FileProcessor


class PDFProcessor(FileProcessor):
    async def process(self, content: bytes, filename: str) -> Dict:
        try:
            pages = []
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pdf_doc = fitz.open(stream=content, filetype="pdf")
                for page_num, (plumber_page, fitz_page) in enumerate(zip(pdf.pages, pdf_doc)):
                    text = plumber_page.extract_text() or ""
                    tables = plumber_page.extract_tables()
                    formatted_tables = [
                        [[cell or "" for cell in row] for row in table]
                        for table in tables
                    ]
                    images = []
                    for img in fitz_page.get_images(full=True):
                        xref = img[0]
                        base_image = pdf_doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
                        images.append({
                            "format": base_image["ext"],
                            "data": image_b64,
                            "width": base_image["width"],
                            "height": base_image["height"]
                        })
                    pages.append({
                        "page_number": page_num + 1,
                        "text": text,
                        "tables": formatted_tables,
                        "images": images
                    })
                pdf_doc.close()
            return {
                "filename": filename,
                "pages": pages,
                "page_count": len(pages)
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process PDF: {str(e)}"}
