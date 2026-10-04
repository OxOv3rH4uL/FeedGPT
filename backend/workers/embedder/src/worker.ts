import {Worker} from "bullmq";
import { EmbeddingJob } from "./models/embedding_job";
import {redis} from "./redis"


const worker = new Worker<EmbeddingJob>("embeddings-ready",
    async(job) =>{
        console.log(`Processing embedding job ${job.id}`)

    },{
        connection: redis,
        concurrency: 5,
        limiter:{
            max:10,
            duration:1000
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
        `[EmbeddingJob] Job ${jobId} stalled`
    );
});

