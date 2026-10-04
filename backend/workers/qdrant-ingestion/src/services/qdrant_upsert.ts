import { qdrant } from "../utils/qdrant";
import { VectorChunk } from "../models/vector_chunk";
import { QDRANT_CONFIG } from "../config/qdrant_config";

export class QdrantUpsertService{
    async upsert(chunks: VectorChunk[]): Promise<void>{
        if(chunks.length == 0){
            return;
        }

        const points = chunks.map(chunk => ({
            id: chunk.chunk.chunk_id,
            vector: chunk.embeddings,
            payload:{
                document_id: chunk.chunk.document_id,
                block_id: chunk.chunk.block_id,
                sequence: chunk.chunk.sequence,
                chunk_index: chunk.chunk.chunk_index,
                text: chunk.chunk.text,
                token_count: chunk.chunk.token_count,
                page: chunk.chunk.page,
                metadata: chunk.chunk.metadata
            }
        }))

        await qdrant.upsert(
            QDRANT_CONFIG.collectionName,{
                wait:true,
                points
            }
        );
    }
}