from fastapi import FastAPI, HTTPException
from app.services.pipeline import Pipeline
import asyncio 
import math
from app.utils.validation import validate_llm_url
from app.schema.chat_request import ChatRequest
from app.services.context_builder import ContextBuilder
from fastapi.responses import StreamingResponse
from app.utils.sse import sse
from fastapi.middleware.cors import CORSMiddleware
from app.services.llm_stream import LLMStreamService


app = FastAPI(
    title="FeedGPT Retrieval Service"
)
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"], 
    allow_headers=["Content-Type"]
)

llm_semaphore = asyncio.Semaphore(20)

pipeline = Pipeline()
context_builder = ContextBuilder()
llm = LLMStreamService()


@app.post("/chat")
async def chat(body:ChatRequest):
    try:
        await validate_llm_url(body.llm_api_url)
    except ValueError as e:
        raise HTTPException(400,str(e))

    points = await pipeline.retrieve(body.query,body.document_id)
    if not points:
        raise HTTPException(400,"Some error occurred, i think document is not ready yet")
    
    chunks = context_builder.build_context(points)

    async def stream():
        try:
            if not chunks:
                yield sse("token",{"t":"Document is not ready yet or it is not available atp"})
                yield sse("done",{})
                return

            yield sse("sources", [{"n": c["n"], "page": c["page"], "block_id": c["block_id"]} for c in chunks])
            messages = context_builder.build_messages(body.query, chunks)

            async with llm_semaphore:
                async with asyncio.timeout(90):
                    async for token in llm.llm_stream(body.llm_api_url,body.llm_api_key,body.llm_model,messages):
                        yield sse("token",{"t":token})

            yield sse("done",{})

        except Exception as e:
            msg= {400: "Problem with LLM. Refresh or try changing the LLM or something went wrong bro :("}
            yield sse("error",{"message": msg})

        

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control":"no-cache"}
    )



    # return await pipeline.retrieve(query=query,document_id=document_id)
    