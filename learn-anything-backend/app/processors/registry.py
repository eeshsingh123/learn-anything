from .audio_processor import AudioProcessor
from .image_processor import ImageProcessor
from .pdf_processor import PDFProcessor
from .docx_processor import DocxProcessor
from .pptx_processor import PptxProcessor
from .text_processor import TextProcessor
from .csv_processor import CSVProcessor
from .url_processor import URLProcessor
from .video_processor import VideoProcessor
from .xlsx_processor import XLSXProcessor

PROCESSOR_REGISTRY = {
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
}
URL_PROCESSOR = URLProcessor()



