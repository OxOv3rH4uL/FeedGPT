FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 HF_HOME=/models

COPY requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer, CrossEncoder; \
SentenceTransformer('BAAI/bge-small-en-v1.5'); CrossEncoder('BAAI/bge-reranker-base')"

COPY . .
RUN useradd -m app && chown -R app /app /models
USER app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9996"]