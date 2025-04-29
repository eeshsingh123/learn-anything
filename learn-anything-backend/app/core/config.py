import os
from dotenv import load_dotenv

load_dotenv()

# system configs
UVICORN_HOST = "0.0.0.0"
UVICORN_PORT = 8000

# supabase keys
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# mongodb keys
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "LearnDB")

# Eleven labs keys
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# LLM api keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


ALLOWED_FILE_TYPES = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-powerpoint": [".ppt"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    "text/plain": [".txt"],
    "text/csv": [".csv"],
    "application/vnd.ms-excel": [".xls", ".csv"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "audio/mpeg": [".mp3"],
    "audio/wav": [".wav"],
    "video/mp4": [".mp4"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
}
