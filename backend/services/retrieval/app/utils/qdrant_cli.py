import os
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
load_dotenv()

qdrant_client = AsyncQdrantClient(
    host = os.getenv("QDRANT_HOST"),
    port = int(os.getenv("QDRANT_PORT"))
)

