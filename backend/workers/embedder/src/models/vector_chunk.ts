import type { EmbedChunk } from "./chunk";

export interface VectorChunk{
    chunk: EmbedChunk,
    embeddings: number[]
}