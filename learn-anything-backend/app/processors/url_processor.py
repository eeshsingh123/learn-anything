import aiohttp
import base64
from typing import Dict, List

from bs4 import BeautifulSoup

from .base import FileProcessor


class URLProcessor(FileProcessor):
    async def process(self, content: str, filename: str) -> Dict:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(content) as response:
                    if response.status != 200:
                        raise ValueError(f"Failed to fetch URL: {response.status}")
                    html_content = await response.text()
            soup = BeautifulSoup(html_content, "html.parser")
            for element in soup(["script", "style"]):
                element.decompose()
            text = soup.get_text(separator="\n", strip=True)
            tables = []
            for table in soup.find_all("table"):
                table_data = []
                for row in table.find_all("tr"):
                    cells = [cell.get_text(strip=True) for cell in row.find_all(["td", "th"])]
                    if cells:
                        table_data.append(cells)
                if table_data:
                    tables.append(table_data)
            images = []
            for img in soup.find_all("img"):
                src = img.get("src")
                if src:
                    if not src.startswith("http"):
                        from urllib.parse import urljoin
                        src = urljoin(content, src)
                    try:
                        async with session.get(src) as img_response:
                            if img_response.status == 200:
                                img_bytes = await img_response.read()
                                img_b64 = base64.b64encode(img_bytes).decode("utf-8")
                                images.append({
                                    "format": src.split(".")[-1].lower() or "unknown",
                                    "data": img_b64,
                                    "width": img.get("width", None),
                                    "height": img.get("height", None)
                                })
                    except Exception:
                        continue
            pages = [{
                "page_number": 1,
                "text": text,
                "tables": tables,
                "images": images
            }]
            return {
                "filename": filename,
                "pages": pages,
                "page_count": len(pages)
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process URL: {str(e)}"}