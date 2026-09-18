from unstructured.partition.auto import partition # type: ignore
from unstructured.partition.pdf import partition_pdf # type: ignore
from pathlib import Path
from app.services.normalizer import normalize_element
from app.models.block_normalizer import NormalizedBlock
from collections.abc import Iterator
import json



class AnalyzerService:
    def parse(self,file_path:str,document_id:str) -> Iterator[NormalizedBlock]:
        elements = partition_pdf(filename=file_path,strategy="hi_res")
        blocks = []
        for seq,element in enumerate(elements):
            block = normalize_element(element,document_id,seq)
            # blocks.append(block)
            yield block
        # return blocks




# filePath = Path(r"C:\Users\91994\OneDrive\Desktop\FeedGPT\backend\services\analyzer\app\assets\TADS.pdf")
# elements = partition_pdf(
#     filename=filePath,
#     strategy="hi_res",
# )

# import json

# data = []

# for element in elements:
#     item = {
#         "type": type(element).__name__,
#         "page": element.metadata.page_number,
#         "coordinates": str(element.metadata.coordinates),
#         "text": str(element),
#     }

#     data.append(item)


# with open("example.json", "w", encoding="utf-8") as file:
#     json.dump(data, file, indent=4, ensure_ascii=False)

    