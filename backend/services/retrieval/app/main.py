from fastapi import FastAPI
from app.services.pipeline import Pipeline
import math
app = FastAPI(
    title="FeedGPT Retrieval Service"
)


pipeline = Pipeline()

@app.post("/chat")
async def chat():
    document_id = "aeab9c8b-0025-404a-b584-d300cbdc9089"
    query = "Define productivity"
    return await pipeline.retrieve(query=query,document_id=document_id)
    