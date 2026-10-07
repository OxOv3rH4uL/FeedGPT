// import { redis_state } from "../queue/redis";

// export class StateManagementService{
//     async initialize(documentID: string) : Promise<void>{
//         await redis_state.hset(
//             `processing:${documentID}`,
//             {
//                 document_id: documentID,
//                 status: "PROCESSING",
//                 analyzer_completed: false,
//                 block_jobs_total:0,
//                 block_jobs_completed: 0,
//                 qdrant_jobs_total: 0,
//                 qdrant_jobs_completed:0,
                
//             }
//         )
//     }
//     async markAnalyzerFinished(document_id: string) : Promise<void>{
//         await redis_state.hset(
//             `processing:${document_id}`,
//             "analyzer_completed",
//             "true"
//         )
//     }
//     async incrementBlockJobs(document_id: string) : Promise<void>{
//         await redis_state.hincrby(
//             `processing:${document_id}`,
//             "block_jobs_total",
//             1
//         )
//     }
//     async incrementCompletedBlockJobs(document_id: string) : Promise<void>{
//         await redis_state.hincrby(
//             `processing:${document_id}`,
//             "block_jobs_completed",
//             1
//         )
//     }
//     async incrementQdrantJobs(document_id: string) : Promise<void>{
//         await redis_state.hincrby(
//             `processing:${document_id}`,
//             "qdrant_jobs_total",
//             1
//         )
//     }
//     async incrementQdrantCompletedJobs(document_id: string) : Promise<void>{
//         await redis_state.hincrby(
//             `processing:${document_id}`,
//             "qdrant_jobs_completed",
//             1
//         )
//     }
//     async getState(document_id : string) : Promise<{
//         document_id: string,
//         status: "PROCESSING" | "READY",
//         analyzer_completed: boolean,
//         block_jobs_total: Number,
//         block_jobs_completed: Number,
//         qdrant_jobs_total: Number,
//         qdrant_jobs_completed: Number
//     }>{
//         const state = await redis_state.hgetall(
//             `processing:${document_id}`
//         )
//         const analyzer_completed = state.analyzer_completed === "true";
//         const block_jobs_total = Number(state.block_jobs_total ?? 0);
//         const block_jobs_completed = Number(state.block_jobs_completed ?? 0);
//         const qdrant_jobs_total = Number(state.qdrant_jobs_total ?? 0);
//         const qdrant_jobs_completed = Number(state.qdrant_jobs_completed??0);

//         const ready = analyzer_completed && block_jobs_total === block_jobs_completed && qdrant_jobs_total === qdrant_jobs_completed;

//         return {
//             document_id : document_id,
//             status : ready ? "READY" : "PROCESSING",
//             analyzer_completed : analyzer_completed,
//             block_jobs_total : block_jobs_total,
//             block_jobs_completed : block_jobs_completed,
//             qdrant_jobs_total : qdrant_jobs_total,
//             qdrant_jobs_completed : qdrant_jobs_completed
//         }
//     }
// }

//waste of time with this logic