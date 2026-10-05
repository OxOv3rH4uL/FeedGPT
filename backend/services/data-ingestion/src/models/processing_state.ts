export type ProcessingStatus = "PROCESSING" | "READY" | "COMPLETED";

export interface ProcessingState {
    document_id: string;
    analyzer_completed: boolean,
    block_jobs_total: number,
    block_jobs_completed: number,
    qdrant_jobs_total: number,
    qdrant_jobs_completed: number,
    status: ProcessingState
}