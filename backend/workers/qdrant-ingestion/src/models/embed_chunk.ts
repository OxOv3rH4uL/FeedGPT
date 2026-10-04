export interface EmbedChunk{
    chunk_id: string
    document_id:string
    block_id:string
    sequence: number
    chunk_index: number
    token_count: number
    text:string
    page: number | null
    metadata: Record<string,unknown> | null
}