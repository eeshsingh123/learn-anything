import json
from io import BytesIO
from typing import List
from datetime import datetime
import mimetypes

from fastapi import APIRouter, HTTPException, File, UploadFile, Form

from app.models.workspace import Workspace
from app.api.dependencies import CurrentUser
from app.db.connection import db
from app.services.logging.logger import logger
from app.models.upload_file import FileInput
from app.processors.registry import PROCESSOR_REGISTRY


router = APIRouter(
    prefix="/workspaces",
    tags=["workspaces"]
)


@router.post("/create_workspace")
async def create_workspace(user: CurrentUser, workspace: dict):
    # check if the workspace already exists
    workspace_name = workspace.get("topic")
    workspace_exists = await db["Workspaces"].find_one(
        {"user_id": user["id"], "name": workspace_name},
        {"name": 1}
    )
    if workspace_exists:
        raise HTTPException(status_code=409, detail="Workspace already exists, please create new one")

    # create a new workspace
    workspace = Workspace(name=workspace_name, user_id=user["id"], created_at=datetime.utcnow())
    workspace = workspace.model_dump()
    workspace_result = await db["Workspaces"].insert_one(workspace)
    workspace_id = str(workspace_result.inserted_id)
    logger.info(f"Workspace created with id: {workspace_id}")

    # return workspace id
    return {
        "message": "Workspace created successfully",
        "data": {"workspace_id": workspace_id}
    }


@router.post("/upload-files")
async def upload_files(user: dict = {"id": "1c11fc11-859c-43de-8683-73e4e5071cf1"},
                       workspace_id: str = Form(...),
                       urls: str = Form(default="[]"),
                       files: List[UploadFile] = File(default=[])):
    try:
        urls = json.loads(urls)
        input_data = FileInput(files=files, urls=urls)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    results = []

    for file in input_data.files:
        try:
            # Read file content directly into memory
            contents = BytesIO()
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                contents.write(chunk)
            contents.seek(0)  # Reset pointer to start of stream
            content = contents.getvalue()

            mime_type, _ = mimetypes.guess_type(file.filename)
            processor = PROCESSOR_REGISTRY.get(mime_type)

            if not processor:
                raise ValueError("Unsupported file type")
            processing_result = await processor.process(content, file.filename)

            file_metadata = {
                "userId": user["id"],
                "workspaceId": workspace_id,
                "filename": file.filename,
                "file_type": mime_type.split("/")[-1],
                "size": file.size,
                "upload_timestamp": datetime.utcnow(),
                "page_count": processing_result.get("page_count", 0),
                "pages": processing_result.get("pages", [])
            }
            await db["Sources"].insert_one(file_metadata)
            results.append({
                "filename": file.filename,
                "page_count": processing_result.get("page_count", 0),
                "processing_result": processing_result
            })
        except Exception as e:
            results.append({"filename": file.filename, "error": f"Processing failed: {str(e)}"})
        finally:
            await file.close()

    return {"results": results}


@router.get("/files")
async def list_files(user: CurrentUser, workspace_id: str):
    files = []
    async for file in db["Sources"].find({"userId": user["id"], "workspaceId": workspace_id}):
        file["_id"] = str(file["_id"])
        files.append(file)

    # handle case for csv and excel files separately
    return {"files": files}

