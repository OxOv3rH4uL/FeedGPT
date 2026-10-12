import asyncio
import math
from concurrent.futures import ThreadPoolExecutor

from sentence_transformers import CrossEncoder


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x)) if x >= 0 else math.exp(x) / (1 + math.exp(x))


class CrossEncoderService:
    def __init__(self):
        self.reranker = CrossEncoder(
            "BAAI/bge-reranker-base",
            max_length=512,                                  
        )
        self.pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="reranker")

    def predict(self, pairs):
        return self.reranker.predict(pairs, batch_size=8)

    async def rerank(self, query: str, points, top: int = 5, timeout: float = 5.0):
        if not points:
            return [], None

        pairs = [(query, p.payload["text"]) for p in points]
        loop = asyncio.get_running_loop()

        try:
            logits = await asyncio.wait_for(
                loop.run_in_executor(self.pool, self.predict, pairs),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            return points[:top], None

        scored = sorted(
            zip(points, (sigmoid(float(s)) for s in logits)),
            key=lambda x: x[1],
            reverse=True,
        )[:top]
        return [p for p, _ in scored], scored[0][1]