import json
def sse(event:str, data:dict) -> str:
    return f"event: {event}\n data: {json.dumps(data)}\n\n"

