from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from ..core.config import MONGO_URI, MONGO_DB_NAME

client = AsyncIOMotorClient(MONGO_URI)
db: AsyncIOMotorDatabase = client[MONGO_DB_NAME]

