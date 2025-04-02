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