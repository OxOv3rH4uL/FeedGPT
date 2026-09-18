import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.document_service import DocumentService
from app.services.analyze import AnalyzerService
from app.services.block_stream import BlockStream
from fastapi.responses import JSONResponse,StreamingResponse

router = APIRouter()


@router.post("/analyze/{document_id}/stream")
def analyze(document_id : str):
    document_service = DocumentService()
    analyzer = AnalyzerService()
    streamer = BlockStream()
    try:
        file_url = document_service.get_file_url(document_id)
        with tempfile.TemporaryDirectory(prefix="feedgpt-analyzer-") as t:
            pdf_path = (Path(t)/"original.pdf")
            # print(pdf_path)
            document_service.download_document(file_url,pdf_path)
            # blocks = analyzer.parse(str(pdf_path),document_id)
            return StreamingResponse(
                streamer.stream(pdf_path=str(pdf_path),document_id=document_id), media_type="application/x-ndjson"
            )
            # return JSONResponse(
            #     status_code=200,
            #     content={
            #         "documentID" : document_id,
            #         "status" :"downloaded",
            #         "url" : file_url
            #     }
            # )
        
    except ValueError as v:
        return JSONResponse(
            status_code=500,
            content={
                "error":str(v)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error":str(e)
            }
        )

