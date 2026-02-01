from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(settings.USERDATA_MONGODB_URL)
    db_instance.db = db_instance.client[settings.USERDATA_DB_NAME]
    print(f"Connected to MongoDB: {settings.USERDATA_DB_NAME}")

async def close_mongo_connection():
    db_instance.client.close()

def get_db():
    return db_instance.db
