import { Worker } from "bullmq";
import { redis } from "./redis";
import { QdrantUpsertService } from "./services/qdrant_upsert";
import { qdrantCollectionSetup } from "./services/qdrant_setup";
import { QdrantJob } from "./models/qdrant_job";

async function start(){

    await qdrantCollectionSetup();
    
    const upserter = new QdrantUpsertService();
    const worker = new Worker<QdrantJob>("qdrant-vector",
        async(job) => {
            const chunks = job.data.chunks;
            await upserter.upsert(chunks);
    
        },{
            connection: redis,
            concurrency:5,
            limiter:{
                max:10,
                duration: 1000
            }
        }
    )
    
    
    worker.on("completed", (job) => {
    
        console.log(
            `Job ${job.id} completed`
        );
    });
    
    worker.on("failed", (job, error) => {
    
        console.error(
            `Job ${job?.id} failed:`,
            error
        );
    });
    
    worker.on("error", (error) => {
    
        console.error(
            "Worker error:",
            error
        );
    });
    
    worker.on("stalled", (jobId) => {
    
        console.warn(
            `[QdrantJob] Job ${jobId} stalled`
        );
    });
}


start().catch(error => {
    console.error("Failed to start Qdrant worker:", error);
    process.exit(1);
});