import uvicorn
import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.dependencies import CurrentUser
from .core.config import UVICORN_HOST, UVICORN_PORT

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/smoke")
async def smoke_test():
    return {"status": 200, "message": f"Current Time: {datetime.datetime.now()}. Application is up and running"}

@app.post("/sample_hit")
async def sample_hit(user: CurrentUser):
    return {
        "status": 200,
        "message": f"User found and created in backend: {user.id}: {user.user_metadata['full_name']}"
    }



if __name__ == "__main__":    
    uvicorn.run(app, host=UVICORN_HOST, port=UVICORN_PORT)