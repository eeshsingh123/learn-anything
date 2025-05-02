import json
from io import BytesIO
from typing import List
from datetime import datetime
import mimetypes

from fastapi import APIRouter, HTTPException, File, UploadFile, Form

from app.processors.registry import PROCESSOR_REGISTRY, URL_PROCESSOR
from app.services.logging.logger import logger
from app.api.dependencies import CurrentUser
from app.models.workspace import Workspace
from app.models.source import Source, Subtype
from app.models.upload_file import FileInput
from app.core.config import MIME_TYPE_MAP
from app.db.connection import db

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

            file_size_in_mb = round(file.size / (1024 * 1024), 2)
            if file_size_in_mb > 20:
                raise ValueError("File size exceeds 20MB limit")

            file_type = mime_type.split("/")[-1]
            if file_type in MIME_TYPE_MAP:
                if file_type == "vnd.ms-excel":
                    file_type = MIME_TYPE_MAP[file_type][1] if file.filename.endswith(".csv") else MIME_TYPE_MAP[file_type][0]
                else:
                    file_type = MIME_TYPE_MAP[file_type][0]

            if not processor:
                raise ValueError("Unsupported file type")
            processing_result = await processor.process(content, file.filename)

            source_metadata = Source(
                user_id=user["id"],
                workspace_id= workspace_id,
                name=file.filename,
                type=file_type,
                size=file_size_in_mb,
                page_count=processing_result.get("page_count", 0),
                pages=processing_result.get("pages", []),
                created_at=datetime.utcnow()
            )
            source_metadata = source_metadata.model_dump()
            await db["Sources"].insert_one(source_metadata)
            results.append({
                "filename": file.filename,
                "page_count": processing_result.get("page_count", 0),
                "processing_result": processing_result
            })
        except Exception as e:
            results.append({"filename": file.filename, "error": f"Processing failed: {str(e)}"})
        finally:
            await file.close()

    for url in input_data.urls:
        try:
            processing_result = await URL_PROCESSOR.process(str(url), url)
            source_metadata = Source(
                user_id=user["id"],
                workspace_id=workspace_id,
                name=url,
                type=Subtype.url,
                size=0,
                page_count=processing_result.get("page_count", 0),
                pages=processing_result.get("pages", []),
                created_at=datetime.utcnow()
            )
            source_metadata = source_metadata.model_dump()
            await db["Sources"].insert_one(source_metadata)
            results.append({
                "filename": url,
                "page_count": processing_result.get("page_count", 0),
                "processing_result": processing_result
            })
        except Exception as e:
            results.append({"filename": url, "error": f"Processing failed: {str(e)}"})

    return {
        "message": f"{len(input_data.files)} files uploaded successfully",
        "data": results
    }


@router.post("/get-storage-capacity")
async def get_storage_capacity(user: CurrentUser, workspace_id: str):
    # Get the total size of all files in the workspace
    total_size = 0
    total_sources = 0
    async for file in db["Sources"].find({"userId": user["id"], "workspaceId": workspace_id}):
        total_sources += 1
        total_size += file.get("size", 0)

    # Convert size to MB
    total_size_mb = round(total_size / (1024 * 1024), 2)
    return {
        "message": "Capacity fetched successfully",
        "data": {"size": total_size_mb, "count": total_sources}
    }

@router.post("/discover-sources")
async def discover_sources(user: CurrentUser, workspace_id: str, query: str):
    # have a llm call here, that takes in the user query and uses that to fetch sources online
    return {
        "message": f"<COUNT> Sources discovered successfully",
        "data": []
    }


@router.get("/sources")
async def list_sources(user: CurrentUser, workspace_id: str):
    files = []
    async for file in db["Sources"].find(
            {"userId": user["id"], "workspaceId": workspace_id},
            {"_id": 1, "name": 1, "type": 1, "size": 1}
    ):
        file["_id"] = str(file["_id"])
        files.append(file)

    return {"message": f"Found {len(files)} files", "data": files}

