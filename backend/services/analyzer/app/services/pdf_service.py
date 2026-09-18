from pathlib import Path

class PDFService:
    def open_pdf(self, file_path: str):
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                "PDF Not found bro"
            )

        return path