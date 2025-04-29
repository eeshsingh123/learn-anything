from io import BytesIO
from typing import Dict

from pydub import AudioSegment
from elevenlabs.client import ElevenLabs

from .base import FileProcessor
from ..core.config import ELEVENLABS_API_KEY


class AudioProcessor(FileProcessor):
    def __init__(self):
        self.client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        self.chunk_duration = 10 * 60 * 1000  # 10 minutes in milliseconds
        self.format_map = {
            "audio/mpeg": "mp3",
            "audio/wav": "wav"
        }

    @staticmethod
    def split_audio(audio, chunk_duration: int):
        total_duration = len(audio)
        for start in range(0, total_duration, chunk_duration):
            end = min(start + chunk_duration, total_duration)
            yield audio[start:end]

    async def process(self, content: bytes, filename: str, mime_type: str = "audio/mpeg") -> Dict:
        try:
            audio_format = self.format_map.get(mime_type, "mp3")
            audio_data = BytesIO(content)
            audio = AudioSegment.from_file(audio_data, format=audio_format)

            pages = []
            page_counter = 1

            for chunk in self.split_audio(audio, self.chunk_duration):
                chunk_buffer = BytesIO()
                chunk.export(chunk_buffer, format=audio_format)
                chunk_buffer.seek(0)

                transcription = self.client.speech_to_text.convert(
                    file=chunk_buffer,
                    model_id="scribe_v1",
                    tag_audio_events=True,
                    language_code="eng",
                    diarize=True
                )

                pages.append({
                    "page_number": page_counter,
                    "text": transcription.text,
                    "tables": [],
                    "images": []
                })
                page_counter += 1

                chunk_buffer.close()

            return {
                "filename": filename,
                "pages": pages,
                "page_count": len(pages)
            }
        except Exception as e:
            return {"filename": filename, "error": f"Failed to process audio: {str(e)}"}