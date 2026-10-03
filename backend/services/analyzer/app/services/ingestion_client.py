import json
import os
from collections.abc import Iterator
from dotenv import load_dotenv

import httpx

load_dotenv()

from app.models.block_normalizer import NormalizedBlock

class Ingestion_Client:
    def __init__(self):
        self.base_url = os.getenv("DATA_INGESTION_URL")

        if not self.base_url:
            raise ValueError("Ingestion url is not present")

    def ingest(self,document_id:str,blocks:Iterator[NormalizedBlock]) -> dict:
        url = f"{self.base_url}/ingestion/{document_id}/blocks"
        blocks_count = 0 
        