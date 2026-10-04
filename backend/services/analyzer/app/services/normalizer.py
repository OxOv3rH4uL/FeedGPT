from app.models.block_normalizer import NormalizedBlock
from unstructured.documents.elements import Element # type: ignore
import uuid

text_elements = ["NarrativeText","Text","Title","Header","Footer","ListItem","FigureCaption","Address","EmailAddress","UncategorizedText",]

def get_type(element:str) -> str:
    if element in text_elements:
        return "text"
    elif element in ["Image","Diagram","Picture"]:
        return "image"
    elif element == "Table":
        return "table"
    else:
        return "other"


def extract_coords(element: Element) -> list[float] | None:
    coordinates = element.metadata.coordinates

    if coordinates is None:
        return None

    points = coordinates.points

    if points is None:
        return None

    x_values = [float(i[0]) for i in points]
    y_values = [float(i[1]) for i in points]

    return [
        min(x_values),
        min(y_values),
        max(x_values),
        max(y_values)
    ]

def normalize_element(element:Element,document_id:str,sequence:int) -> NormalizedBlock:
    element_type = type(element).__name__
    content = str(element).strip()

    if not content:
        content = None

    metadata = {}
    if hasattr(element.metadata,"text_as_html"):
        text_as_html = element.metadata.text_as_html

        if text_as_html:
            metadata["text_as_html"] = text_as_html

    return NormalizedBlock(
        block_id = str(uuid.uuid4()),
        document_id=document_id,
        type = get_type(element_type),
        element_type=element_type,
        page=element.metadata.page_number,
        sequence=sequence,
        coords=extract_coords(element),
        text=content,
        metadata=metadata
    )
