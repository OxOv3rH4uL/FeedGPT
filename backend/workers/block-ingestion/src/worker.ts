import { Worker } from "bullmq";
import {redis} from "./redis";

import { BlockIngestionService } from "./services/ingestion.service";
import { BlockIngestionJob } from "./models/ingestion_job";
import {prisma} from "./services/prisma"

const ingestionService = new BlockIngestionService();

const worker = new Worker<BlockIngestionJob>("data-ingestion", async(job) => {
    console.log("Processing Job: " + job.id);
    await ingestionService.ingest(job.data);
    console.log("Job processed successfully! " + job.id);

    return {
        batchID: job.data.batchID
    };
},{
    connection: redis,
    concurrency: 5,
    limiter:{
        max:10,
        duration:1000
    }
})

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
        `[BlockIngestion] Job ${jobId} stalled`
    );
});

