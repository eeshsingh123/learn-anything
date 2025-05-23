import os
from dotenv import load_dotenv

load_dotenv()

# system configs
UVICORN_HOST = "0.0.0.0"
UVICORN_PORT = 8000

# GOOGLE CREDENTIALS
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI= os.getenv("GOOGLE_REDIRECT_URI")
NEXT_REDIRECT_URL = os.getenv("NEXT_REDIRECT_URL")

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

# Exa api key - for the web search
EXA_API_KEY = os.getenv("EXA_API_KEY")

# this mime type map is to map the actual file-type inside the mongodb document instead of keeping their extensions
MIME_TYPE_MAP = {
    "vnd.ms-excel": ["xls", "csv"],
    "vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "vnd.ms-powerpoint": ["ppt"],
    "vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
    "plain": ["txt"],
    "vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
    "msword": ["doc"]
}

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

PROCESSOR_REGISTRY = {}
