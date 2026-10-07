import hashlib

def embedding_key(query: str, model:str) -> str:
    normalized_query = query.strip().lower()
    hashed = hashlib.sha256(normalized_query.encode("utf-8")).hexdigest()
    return f"embedding:{model}:{hashed}"

