from io import BytesIO
from typing import Dict

from elevenlabs.client import ElevenLabs

from .base import FileProcessor
from ..core.config import ELEVENLABS_API_KEY


class AudioProcessor(FileProcessor):
    def __init__(self):
        self.client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

    async def process(self, content: bytes, filename: str, mime_type: str = "audio/mpeg") -> Dict:
        try:
            audio_data = BytesIO(content)
            pages = []
            page_counter = 1

            transcription = self.client.speech_to_text.convert(
                file=audio_data,
                model_id="scribe_v1",
                tag_audio_events=True,
                diarize=True
            )

            pages.append({
                "page_number": page_counter,
                "text": transcription.text,
                "tables": [],
                "images": []
            })

            return {
                "filename": filename,
                "pages": pages,
                "page_count": len(pages)
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process audio: {str(e)}"}