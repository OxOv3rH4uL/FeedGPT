from typing import Literal
from pydantic import BaseModel

block_type = Literal[
    "text",
    "table",
    "image",
    "other"
]

class NormalizedBlock(BaseModel):
    block_id: str
    document_id: str
    type: block_type
    element_type: str
    page: int | None
    sequence:int
    coords: list[float] | None 
    text : str | None
    metadata : dict | None
