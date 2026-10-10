from fastapi import FastAPI
from app.services.pipeline import Pipeline
import math
app = FastAPI(
    title="FeedGPT Retrieval Service"
)


pipeline = Pipeline()

@app.post("/chat")
async def chat():
    document_id = "d591dd20-fa5c-448a-9107-f09698bf9d8d"
    query = "Define productivity"
    return await pipeline.retrieve(query=query,document_id=document_id)
    