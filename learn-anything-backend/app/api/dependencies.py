from datetime import datetime
from typing import Annotated

from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

from supabase import create_client, Client

from ..core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from ..db.connection import db
from ..models.user import User


supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="supabase-auth")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    try:
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = response.user
                
        # check in redis -> if not exsits -> check mongodb -> if not exists -> create
        mongo_user = await db["Users"].find_one({"user_id": user.id})
        if not mongo_user:
            print("creating user as it does not exist")
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

        return user
                
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Auth token validation failed: {str(e)}")
    
CurrentUser = Annotated[object, Depends(get_current_user)]