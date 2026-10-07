import {Worker} from "bullmq";
import { EmbeddingJob } from "./models/embedding_job";
import {redis} from "./redis"
import { ChunkService } from "./services/chunker";
import { EmbedService } from "./services/embedder";
import { NormalizedBlock } from "./models/block";
import { EmbedChunk } from "./models/chunk";
import { emit } from "./utils/event";

const chunker = new ChunkService();
const embedder = new EmbedService();
const worker = new Worker<EmbeddingJob>("embeddings-ready",
    async(job) =>{
        // console.log(`Processing embedding job ${job.id}`)
        const mass_chunks : EmbedChunk[] = [];
        const blocks: NormalizedBlock[] = job.data.blocks;
        for(const block of blocks){
            const chunks: EmbedChunk[] = await chunker.chunkBlock(block);
            mass_chunks.push(...chunks);
        }
        await embedder.embed(mass_chunks);  
        await emit({
            type:"qdrant_done",
            document_id: job.data.document_id,
            batch_id: job.data.batchID
        })



    },{
        connection: redis,
        concurrency: 20,
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

