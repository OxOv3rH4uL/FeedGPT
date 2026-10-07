import os
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

redis_client = redis.Redis(
    host=os.getenv("REDIS_CACHE_HOST"),
    port=int(os.getenv("REDIS_CACHE_PORT")),
    decode_responses=True
)