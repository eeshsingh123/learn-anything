import json
from bson import ObjectId
from io import BytesIO
from typing import List
from datetime import datetime
import mimetypes

from pymongo import InsertOne
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.core.registry import PROCESSOR_REGISTRY, URL_PROCESSOR, GOOGLE_DRIVE_PROCESSOR
from app.services.discover.discover_sources import discover_additional_web_sources
from app.services.logging.logger import logger
from app.api.dependencies import CurrentUser, refresh_credentials
from app.models.workspace import Workspace
from app.models.source import Source, Subtype
from app.models.upload_file import FileInput
from app.core.config import MIME_TYPE_MAP, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, \
    NEXT_REDIRECT_URL
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


# Google Drive upload endpoints
@router.get("/auth/google")
async def auth_google(user: dict = {"id": "1c11fc11-859c-43de-8683-73e4e5071cf1"}): # todo: replace with user: CurrentUser
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uris": [GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/drive.readonly",
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ],
    )
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
        state=user["id"]
    )
    return {"authorization_url": authorization_url}


@router.get("/auth/google/callback")
async def auth_google_callback(code: str, state: str):
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uris": [GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/drive.readonly",
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ],
    )
    try:
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        flow.fetch_token(code=code)
        credentials = flow.credentials
        credentials_json = credentials.to_json()

        
        # Store the credentials
        await db["Tokens"].update_one(
            {"user_id": state},
            {"$set": {"credentials": json.loads(credentials_json)}},
            upsert=True
        )
        
        # Instead of simple redirect, redirect with success status
        redirect_url = f"{NEXT_REDIRECT_URL}?connection_status=success&state={state}"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        # Redirect with error status if something fails
        error_msg = str(e).replace(" ", "+")  # URL-safe error message
        redirect_url = f"{NEXT_REDIRECT_URL}?connection_status=error&error={error_msg}&state={state}"
        return RedirectResponse(url=redirect_url)


@router.get("/auth/google/picker-token")
async def get_picker_token(user: dict = {"id": "1c11fc11-859c-43de-8683-73e4e5071cf1"}): # todo: replace with user: CurrentUser):
    token_doc = await db["Tokens"].find_one({"user_id": user["id"]})
    if not token_doc or "credentials" not in token_doc:
        raise HTTPException(status_code=401, detail="User not authenticated with Google Drive")

    credentials = await refresh_credentials(token_doc["credentials"], user_id=user["id"])
    return {"access_token": credentials.token}


@router.post("/upload-files")
async def upload_files(user: dict = {"id": "1c11fc11-859c-43de-8683-73e4e5071cf1"}, # todo: replace with user: CurrentUser
                       workspace_id: str = Form(...),
                       urls: str = Form(default="[]"),
                       drive_file_ids: str = Form(default="[]"),
                       files: List[UploadFile] = File(default=[])):
    try:
        urls = json.loads(urls)
        drive_file_ids_list = json.loads(drive_file_ids)
        if not isinstance(urls, list) or not isinstance(drive_file_ids_list, list):
            raise ValueError("URLs and drive_file_ids must be lists")
        input_data = FileInput(files=files, urls=urls)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    results = []
    # process files in the input
    file_operations = []
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
            file_operations.append(
                InsertOne(source_metadata.model_dump())
            )
            results.append({
                "filename": file.filename,
                "page_count": processing_result.get("page_count", 0),
                "processing_result": processing_result
            })
        except Exception as e:
            results.append({"filename": file.filename, "error": f"Processing failed: {str(e)}"})
        finally:
            await file.close()
    if file_operations:
        logger.info(f"Inserting {len(file_operations)} file sources into the database")
        op_result = await db["Sources"].bulk_write(file_operations)
        inserted_ids = list(op_result.upserted_ids.values())
        for idx, result in enumerate(results):
            if "error" not in result:
                results[idx]["source_id"] = str(inserted_ids[idx])

    # process URLS in the input
    url_operations = []
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
            url_operations.append(
                InsertOne(source_metadata.model_dump())
            )
            results.append({
                "filename": url,
                "page_count": processing_result.get("page_count", 0),
                "processing_result": processing_result
            })
        except Exception as e:
            results.append({"filename": url, "error": f"Processing failed: {str(e)}"})
    if url_operations:
        logger.info(f"Inserting {len(url_operations)} URL sources into the database")
        op_result = await db["Sources"].insert_many(url_operations)
        inserted_ids = list(op_result.inserted_ids)
        for idx, result in enumerate(results):
            if "error" not in result:
                results[idx]["source_id"] = str(inserted_ids[idx])

    if drive_file_ids_list:
        try:
            token_doc = await db["Tokens"].find_one({"user_id": user["id"]})
            if not token_doc or "credentials" not in token_doc:
                raise ValueError("User not authenticated with Google Drive")

            credentials = token_doc["credentials"]
            credentials = await refresh_credentials(credentials, user["id"])

            processing_results = await GOOGLE_DRIVE_PROCESSOR.process(drive_file_ids_list, credentials.to_json())
            drive_operations = []
            for result in processing_results:
                if "error" in result:
                    results.append(result)
                    continue

                source_metadata = Source(
                    user_id=user["id"],
                    workspace_id=workspace_id,
                    name=result["filename"],
                    type=Subtype.drive,
                    size=0,
                    page_count=result.get("page_count", 0),
                    pages=result.get("pages", []),
                    created_at=datetime.utcnow()
                )
                drive_operations.append(
                    InsertOne(source_metadata.model_dump())
                )
                results.append({
                    "filename": result["filename"],
                    "page_count": result.get("page_count", 0),
                    "processing_result": result
                })

            if drive_operations:
                logger.info(f"Inserting {len(drive_operations)} Google Drive sources into the database")
                op_result = await db["Sources"].bulk_write(drive_operations)
                inserted_ids = list(op_result.upserted_ids.values())
                for idx, result in enumerate(processing_results):
                    if "error" not in result:
                        results[idx]["source_id"] = str(inserted_ids[idx])
        except Exception as e:
            results.append({"filename": "google_drive_files", "error": f"Processing failed: {str(e)}"})

    return {
        "message": f"{len(input_data.files)} files uploaded successfully",
        "data": results
    }


@router.post("/get-storage-capacity")
async def get_storage_capacity(user: CurrentUser, workspace_id: str):
    # Get the total size of all files in the workspace
    total_size = 0
    total_sources = 0
    async for file in db["Sources"].find({"user_id": user["id"], "workspace_id": workspace_id}):
        total_sources += 1
        total_size += file.get("size", 0)

    # Convert size to MB
    total_size_mb = round(total_size / (1024 * 1024), 2)
    return {
        "message": "Capacity fetched successfully",
        "data": {"size": total_size_mb, "count": total_sources}
    }


@router.post("/discover-sources")
async def discover_web_sources(user: CurrentUser, workspace_id: str, query: str):
    # some guardrails to check if user is not exploiting this functionality
    user_discover_usage = await db["UserTelemetry"].find_one({"user_id": user["id"]})
    if user_discover_usage:
        if user_discover_usage["discover_queries_made"] > 5:
            raise HTTPException(status_code=403, detail="You have reached the limit of 5 queries per day")

    # update the discover usage count
    await db["UserTelemetry"].update_one(
        {"user_id": user["id"]},
        {"$inc": {"discover_queries_made": 1}}
    )

    try:
        discovered_sources_map = []
        discovered_sources = await discover_additional_web_sources(query)
        operations = []
        for source in discovered_sources:
            for result in source["sources"]:
                source_metadata = Source(
                    user_id=user["id"],
                    workspace_id=workspace_id,
                    name=result["title"],
                    type=Subtype.discovered,
                    size=0.0,
                    page_count=1,
                    pages=[{
                        "page_number": 1,
                        "text": result["text"],
                        "url": result["url"],
                        "author": result["author"],
                        "tables": [],
                        "images": []
                    }],
                    usage=source["usage"],
                    batch_id=source["batch_id"],  # this is only for discovered src to filter them during finalization
                    created_at=datetime.utcnow()
                )
                operations.append(
                    InsertOne(source_metadata.model_dump())
                )

        if operations:
            logger.info(f"Inserting {len(operations)} discovered sources into the database")
            op_result = await db["Sources"].bulk_write(operations)
            inserted_ids = list(op_result.upserted_ids.values())
            discovered_sources_map = [
                {
                    inserted_ids[idx]: src["id"]  # the src["id"] is the url found as a source
                }
                for idx, src in enumerate(discovered_sources["sources"])
            ]


    except Exception as e:
        logger.error(f"Error in discover sources: {str(e)}")
        raise HTTPException(status_code=500, detail="Error in discovering sources")


    return {
        "message": f"{len(discovered_sources_map)} Sources discovered successfully",
        "data": discovered_sources_map
    }



@router.post("/finalize-discovered-sources")
async def finalize_discovered_sources(user: CurrentUser, workspace_id: str, batch_id: str, source_ids: List[str]):
    removed_sources = await db["Sources"].delete_many(
        {"user_id": user["id"], "workspace_id": workspace_id, "batch_id": batch_id},
        {"_id": {"$nin": [ObjectId(src_id) for src_id in source_ids]}}
    )
    logger.info(f"Removed {removed_sources.deleted_count} discovered sources from the database")
    return {"message": "Selected discovered sources finalized successfully"}



@router.get("/sources")
async def list_sources(user: CurrentUser, workspace_id: str):
    files = []
    async for file in db["Sources"].find(
            {"user_id": user["id"], "workspace_id": workspace_id},
            {"_id": 1, "name": 1, "type": 1, "size": 1}
    ):
        file["_id"] = str(file["_id"])
        files.append(file)

    return {"message": f"Found {len(files)} files", "data": files}

