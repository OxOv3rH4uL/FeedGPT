from fastapi import FastAPI

from app.routes.analyze import router as analyzer_routes

app = FastAPI(
    title="FeedGPT Analyzer Service"
)

app.include_router(analyzer_routes)