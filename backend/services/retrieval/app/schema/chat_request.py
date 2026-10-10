from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    document_id : str
    query: str = Field(min_length=1, max_length=2000)
    llm_api_url: str
    llm_api_key: str
    llm_model : str
    