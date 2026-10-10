import os
from dotenv import load_dotenv
from qdrant_client.models import SparseVector, Filter, FieldCondition,MatchValue
from app.utils.qdrant_cli import qdrant_client as client
from app.utils.sparse_vector import to_sparse

load_dotenv()

class BM25Search:
    def __init__(self):
        self.collection_name = os.getenv("QDRANT_COLLECTION")
    async def search(self, query: str, document_id: str, k: int = 60):

        idx, _ = to_sparse(query)
        if not idx:              
            return []

        res = await client.query_points(
            collection_name=self.collection_name,
            query=SparseVector(indices=idx, values=[1.0] * len(idx)),
            using="bm25",     
            query_filter=Filter(must=[
                FieldCondition(key="document_id", match=MatchValue(value=document_id))
            ]),
            limit=k,
            with_payload=True,
        )
        return res.points





