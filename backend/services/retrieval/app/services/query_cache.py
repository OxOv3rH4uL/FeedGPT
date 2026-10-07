import json
from app.utils.redis import redis_client

class QueryCache:
    def __init__(self):
        self.redis = redis_client

    async def get(self,query: str) -> list[float] | None:
        val = await self.redis.get(query)
        if val is None:
            return None
        return json.loads(val)

    async def set(self, query: str, embedding: list[float],ttl:int = 7200) -> None:
        await self.redis.set(query,json.dumps(embedding),ex=ttl)
