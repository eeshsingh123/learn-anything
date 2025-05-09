from fastapi import APIRouter, HTTPException, File, UploadFile, Form

from app.db.connection import db
from pymongo import InsertOne

router = APIRouter(
    prefix="/workspaces",
    tags=["workspaces"]
)