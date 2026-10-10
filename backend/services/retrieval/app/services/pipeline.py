from app.services.semantic_search import SemanticSearch
from app.services.query_embedding import QueryEmbedding
from app.services.bm25 import BM25Search
from app.services.reciprocal_rank_fusion import ReciprocalRankFusion
from app.services.cross_encoder import CrossEncoderService
class Pipeline:
    def __init__(self):
        self.semantic_search = SemanticSearch()
        self.query_embedding = QueryEmbedding()
        self.bm25_search = BM25Search()
        self.reciprocal_rank_fusion = ReciprocalRankFusion()
        self.cross_encoder = CrossEncoderService()
        

    async def retrieve(self,query:str,document_id:str):
        embedding,status = await self.query_embedding.embed(query=query)
        chunks_1= await  self.semantic_search.search(embedding=embedding,document_id=document_id)
        chunks_2 = await self.bm25_search.search(query=query,document_id=document_id)
        candidates = self.reciprocal_rank_fusion.rrf(chunks_1,chunks_2)
        best_chunks, score = await self.cross_encoder.rerank(query,candidates)
        if score is not None and score < 0.05:
            return None
        return best_chunks
