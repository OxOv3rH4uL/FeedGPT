import os
from transformers import AutoTokenizer, AutoModel 
import torch
from dotenv import load_dotenv
load_dotenv()
class QueryEmbedding:
    def __init__(self):
        self.model_name = os.getenv("MODEL_NAME")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModel.from_pretrained(self.model_name)

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

    def embed(self, query:str) -> list[float]:
        [ip,op] = self.tokenize(query)
        pooled = self.mean_pooling(op,ip["attention_mask"])
        normalized = self.normalize(pooled)
        return normalized.squeeze(0).tolist()
    

