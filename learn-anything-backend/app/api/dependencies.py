import json
from datetime import datetime
from typing import Annotated, Dict

from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

from supabase import create_client, Client
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

from ..core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from ..db.connection import db
from ..models.user import User
from ..models.telemetry import UserTelemetry
from ..services.logging.logger import logger


supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="supabase-auth")


async def refresh_credentials(credentials: Dict, user_id: str) -> Credentials:
    creds = Credentials.from_authorized_user_info(credentials)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        await db["Tokens"].update_one(
            {"user_id": user_id},
            {"$set": {"credentials": json.loads(creds.to_json())}}
        )
    elif creds.expired:
        raise Exception("Token expired and no refresh token available.")
    return creds


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    try:
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = response.user
                
        # check in redis -> if not exists -> check mongodb -> if not exists -> create
        mongo_user = await db["Users"].find_one({"user_id": user.id})
        user_telemetry = await db["UserTelemetry"].find_one({"user_id": user.id})
        if not mongo_user:
            logger.info("creating user as it does not exist")
            # Create new user in MongoDB
            new_user = User(
                user_id=user.id,
                preference_id=None,
                email=user.email,
                name=user.user_metadata["full_name"],
                created_at=user.created_at or datetime.utcnow()
            )
            new_user = new_user.model_dump()
            await db["Users"].insert_one(new_user)
            # add redis caching here to avoid querying mongodb again and again

        if not user_telemetry:
            logger.info("creating user telemetry as it does not exist")
            # Create new user telemetry in MongoDB
            new_user_telemetry = UserTelemetry(
                user_id=user.id,
                workspaces_created=0,
                sources_uploaded=0,
                storage_used=0.0,
                streak=0,
                largest_streak=0,
                discover_queries_made=0,
                created_at=datetime.utcnow()
            )
            new_user_telemetry = new_user_telemetry.model_dump()
            await db["UserTelemetry"].insert_one(new_user_telemetry)
            # add redis caching here to avoid querying mongodb again and again

        return user.model_dump()
                
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Auth token validation failed: {str(e)}")
    
CurrentUser = Annotated[object, Depends(get_current_user)]