from app.core.config import PROCESSOR_REGISTRY

from app.processors.audio_processor import AudioProcessor
from app.processors.google_drive_processor import GoogleDriveProcessor
from app.processors.image_processor import ImageProcessor
from app.processors.pdf_processor import PDFProcessor
from app.processors.docx_processor import DocxProcessor
from app.processors.pptx_processor import PptxProcessor
from app.processors.text_processor import TextProcessor
from app.processors.csv_processor import CSVProcessor
from app.processors.url_processor import URLProcessor
from app.processors.video_processor import VideoProcessor
from app.processors.xlsx_processor import XLSXProcessor


def initialize_registry():
    """
    Initialize the processor registry with all available processors.
    This function is called at the start of the application to ensure
    that all processors are registered and ready to use.
    """
    # Register all processors here
    PROCESSOR_REGISTRY.update({
        "application/pdf": PDFProcessor(),
        "application/msword": DocxProcessor(),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocxProcessor(),
        "application/vnd.ms-powerpoint": PptxProcessor(),
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": PptxProcessor(),
        "text/plain": TextProcessor(),
        "text/csv": CSVProcessor(),
        "application/vnd.ms-excel": CSVProcessor(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": XLSXProcessor(),
        "audio/mpeg": AudioProcessor(),
        "audio/wav": AudioProcessor(),
        "image/jpeg": ImageProcessor(),
        "image/png": ImageProcessor(),
        "video/mp4": VideoProcessor(),
    })

URL_PROCESSOR = URLProcessor()
GOOGLE_DRIVE_PROCESSOR = GoogleDriveProcessor()
initialize_registry()


