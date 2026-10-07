import { Worker } from "bullmq";
import {redis} from "./redis";

import { BlockIngestionService } from "./services/ingestion.service";
import { BlockIngestionJob } from "./models/ingestion_job";
import {prisma} from "./services/prisma"
import { emit } from "./utils/event";

const ingestionService = new BlockIngestionService();

const worker = new Worker<BlockIngestionJob>("data-ingestion", async(job) => {
    console.log("Processing Job: " + job.id);
    await ingestionService.ingest(job.data);
    console.log("Job processed successfully! " + job.id);
    await emit({
        type:"pg_done",
        document_id: job.data.document_id,
        batch_id: job.data.batchID
    })
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

worker.on("failed", async(job, error) => {
    if(job && job.attemptsMade >= (job.opts.attempts ?? 1)){
        try{
            await emit({
                type:"block_failed",
                document_id: job.data.document_id,
                batch_id: job.data.batchID,
                stage:"postgre"
            })
        }catch(e){
            console.error("Couldnt add it to event queue, check its service")
        }
    }
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

