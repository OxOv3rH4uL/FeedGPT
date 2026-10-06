

export interface State{
    document_id: string,
    status : string,
    total_block_job : Number,
    postgres: {
        done: Number,
        failed: Number
    },
    qdrant: {
        done: Number,
        failed: Number
    }
}