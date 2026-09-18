from typing import Literal
from pydantic import BaseModel
from app.models.block_normalizer import NormalizedBlock

class BlockEvent(BaseModel):
    event: Literal["block"] = "block"
    block: NormalizedBlock

class CompleteEvent(BaseModel):
    event: Literal["complete"] = "complete"
    document_id: str
    block_count : int

