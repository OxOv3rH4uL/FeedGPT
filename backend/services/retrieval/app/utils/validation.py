import asyncio
import os
import ipaddress
from urllib.parse import urlparse

async def validate_llm_url(url:str) -> None:
    p = urlparse(url)
    if not p.hostname or p.scheme not in ("https","http"):
        raise ValueError("LLM url is invalid")

    