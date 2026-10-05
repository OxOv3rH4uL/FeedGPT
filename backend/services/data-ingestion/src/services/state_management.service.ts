import { redis_state } from "../queue/redis";

export class StateManagementService{
    async initialize(documentID: string) : Promise<void>{
        await redis_state.hset(
            `processing:${documentID}`,
            {
                document_id: documentID,
                status: "PROCESSING",
                analyzer_completed: false,
                block_jobs_total:0,
                block_jobs_completed: 0,
                qdrant_jobs_total: 0,
                qdrant_jobs_completed:0,
                
            }
        )
    }
    async markAnalyzerFinished(document_id: string) : Promise<void>{
        await redis_state.hset(
            `processing:${document_id}`,
            "analyzer_completed",
            "true"
        )
    }
    async incrementBlockJobs(document_id: string) : Promise<void>{
        await redis_state.hincrby(
            `processing:${document_id}`,
            "block_jobs_total",
            1
        )
    }
    async incrementCompletedBlockJobs(document_id: string) : Promise<void>{
        await redis_state.hincrby(
            `processing:${document_id}`,
            "block_jobs_completed",
            1
        )
    }
    async incrementQdrantJobs(document_id: string) : Promise<void>{
        await redis_state.hincrby(
            `processing:${document_id}`,
            "qdrant_jobs_total",
            1
        )
    }
    async incrementQdrantCompletedJobs(document_id: string) : Promise<void>{
        await redis_state.hincrby(
            `processing:${document_id}`,
            "qdrant_jobs_completed",
            1
        )
    }
}