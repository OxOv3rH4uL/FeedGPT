import type { VectorChunk } from "./vector_chunk";

export interface QdrantJob{
    document_id: string,
    chunks: VectorChunk[]
}