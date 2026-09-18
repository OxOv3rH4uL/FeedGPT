import type { NormalizedBlock } from "../schema/schema"

export interface BlockIngestionJob{
    document_id:string;
    batchID: string;
    start_seq: number;
    end_seq: number;
    blocks: NormalizedBlock[];
}   