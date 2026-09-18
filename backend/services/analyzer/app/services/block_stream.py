import json
from collections.abc import Iterator

from app.models.stream_event import BlockEvent,CompleteEvent
from app.services.analyze import AnalyzerService

class BlockStream:
    def __init__(self):
        self.analyzer = AnalyzerService()

    def stream(self,file_path:str,document_id:str)-> Iterator[str]:
        bc = 0
        for block in self.analyzer.parse(file_path,document_id):
            event = BlockEvent(block=block)

            yield(
                event.model_dump_json() + "\n"
            )
            bc+=1

        complete_event = CompleteEvent(document_id=document_id,block_count=bc)

        yield(
            complete_event.model_dump_json + "\n"
        )

        
