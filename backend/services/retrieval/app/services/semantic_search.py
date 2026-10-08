import os
from app.utils.qdrant_cli import qdrant_client as client
from qdrant_client.models import Filter, FieldCondition, MatchValue
from dotenv import load_dotenv

load_dotenv()
class SemanticSearch:
    def __init__(self):
        self.collection_name = os.getenv("QDRANT_COLLECTION")

    async def search(self,embedding: list[float], document_id: str,  k: int = 50):
        results = await client.query_points(
            collection_name = self.collection_name,
            query=embedding,
            query_filter=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(
                            value=document_id
                        ),
                    )
                ]
            ),
            limit=k
        )
        return results.points
    