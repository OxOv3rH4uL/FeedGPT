import math
from sentence_transformers import CrossEncoder
import asyncio
class CrossEncoderService:
    def __init__(self):
        self.reranker = CrossEncoder("BAAI/bge-reranker-base") #i hope it is dimension

    async def rerank(self,query:str,points,top:int=5,timeout:float=5.0):
        if not points:
            return [],None
        pairs = [(query,i.payload["text"]) for i in points]
        try:
            logits = await asyncio.wait_for(
                asyncio.to_thread(self.reranker.predict,pairs),timeout=timeout
            )
        except asyncio.TimeoutError:
            return points[:top], None

        scored = sorted(
            zip(points,(1/(1+math.exp(-float(s))) for s in logits)),
            key=lambda x:x[1], reverse=True
        )[:top]
        return [i for i,_ in scored],scored[0][1]