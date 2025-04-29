import uvicorn
import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routers.workspaces import router as workspaces_router
from .core.config import UVICORN_HOST, UVICORN_PORT

app = FastAPI()
app.include_router(workspaces_router)

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


if __name__ == "__main__":    
    uvicorn.run(app, host=UVICORN_HOST, port=UVICORN_PORT)
