import type { NormalizedBlock } from "../models/block"

export interface EmbeddingJob{
    document_id:string;
    batchID: string;
    start_seq: number;
    end_seq: number;
    blocks: NormalizedBlock[];
}   