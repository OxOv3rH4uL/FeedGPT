import json
import httpx

class LLMStreamService:
    async def llm_stream(self,url:str,api_key:str,model:str,messages:list[dict]):
        endpoint = url.rstrip("/") + "/chat/completions"
        timeout = httpx.Timeout(60.0, connect=10.0)

        async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
            async with client.stream(
                "POST", endpoint,
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": model, "messages": messages, "stream": True, "temperature": 0.2},
            ) as r:
                if r.status_code != 200:
                    raise Exception(r.status_code)
                async for line in r.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        delta = json.loads(data)["choices"][0]["delta"].get("content")
                    except (KeyError, IndexError, json.JSONDecodeError):
                        continue
                    if delta:
                        yield delta