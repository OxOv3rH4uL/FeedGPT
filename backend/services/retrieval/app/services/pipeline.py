from app.services.semantic_search import SemanticSearch
from app.services.query_embedding import QueryEmbedding
class Pipeline:
    def __init__(self):
        self.semantic_search = SemanticSearch()
        self.query_embedding = QueryEmbedding()

    async def retrieve(self,query:str,document_id:str):
        embedding,status = await self.query_embedding.embed(query=query)
        chunks = await self.semantic_search.search(embedding=embedding,document_id=document_id)
        return chunks