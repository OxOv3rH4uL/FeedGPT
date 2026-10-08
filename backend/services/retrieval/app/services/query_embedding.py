import os
from transformers import AutoTokenizer, AutoModel 
import torch
from dotenv import load_dotenv
from app.services.query_cache import QueryCache
from app.utils.hash_key import embedding_key as cache_key
load_dotenv()


class QueryEmbedding:
    def __init__(self):
        self.model_name = os.getenv("MODEL_NAME")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModel.from_pretrained(self.model_name)
        self.cache = QueryCache()
        

    def tokenize(self,query:str):
        ip = self.tokenizer(query,return_tensors="pt",truncation=True,padding=True)
        with torch.no_grad():
            op = self.model(**ip)
        return [ip,op]

    def mean_pooling(self,model_op, attention_mask):
        token_embeddings = model_op.last_hidden_state
        ip_mask = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        total_embeddings = torch.sum((token_embeddings * ip_mask), dim=1)
        total_mask = torch.clamp(ip_mask.sum(dim=1),min=1e-9)
        return total_embeddings/total_mask

    def normalize(self,embedding):
        embedding = torch.nn.functional.normalize(
            embedding,
            p=2,
            dim=1
        )
        return embedding

    async def embed(self, query:str) -> list[float]:
        key = cache_key(query=query,model=self.model_name)
        cached = await self.cache.get(query=query)

        if cached is not None:
            return cached, "HIT"
        
        [ip,op] = self.tokenize(query)
        pooled = self.mean_pooling(op,ip["attention_mask"])
        normalized = self.normalize(pooled)
        normalized = normalized.squeeze(0).tolist()
        # return normalized.squeeze(0).tolist()
        await self.cache.set(query=key,embedding=normalized)
        return normalized, "MISS"
    

