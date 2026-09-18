import boto3 # type: ignore
from dotenv import load_dotenv
import psycopg # type: ignore
import os

load_dotenv()
class DocumentService:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url= os.environ["MINIO_ENDPOINT"],
            aws_access_key_id = os.environ["MINIO_ACCESS_KEY"],
            aws_secret_access_key = os.environ["MINIO_SECRET_KEY"]
        )

    def download_document(self,url: str, destination: str) -> None:
        # print(os.environ["MINIO_BUCKET"])
        self.client.download_file(
            os.environ["MINIO_BUCKET"],
            url,
            destination
        )

    def get_file_url(self, document_id: str) -> str:
        DB_URL = os.environ["DATABASE_URL"]
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT url from documents where id = %s
                    """,
                    (document_id,),
                )
                row = cursor.fetchone()

        if row is None:
            raise ValueError(
                "File not found"
            )
        return row[0]

    