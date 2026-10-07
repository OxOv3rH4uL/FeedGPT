import type { FastifyInstance } from "fastify";
import { createInterface } from "readline";
import { streamEventSchema } from "../schema/schema";
import { ingestionQueue } from "../queue/ingestion.queue";
import { embedderQueue } from "../queue/embedder.queue";
import type { NormalizedBlock } from "../models/block";
import type { BlockIngestionJob } from "../models/ingestion_job";
import { emit } from "../utils/events";

const BATCH_SIZE=500;
interface ingestionParams{
    document_id:string
}

export async function ingestRoute(app: FastifyInstance){
    app.post<{Params:ingestionParams}>("/ingestion/:document_id/blocks", async(req,res)=>{
        const {document_id} = req.params;
        const content_type = req.headers["content-type"]

        if(!content_type?.startsWith("application/x-ndjson")){
            return res.code(415).send({
                error:"Content type should be application/x-ndjson"
            })
        }
        
        let batch : NormalizedBlock[] = [];
        let batch_number = 0;
        let total = 0;
        let completed = false;

        const readline = createInterface({
            input: req.raw,
            crlfDelay: Infinity
        })
        for await(const i of readline){
            if(!i.trim()){
                continue;
            }
            let parsed: unknown;
            try{
                parsed = JSON.parse(i);
            }catch{
                return res.code(400).send({
                    error: "Invalid JSON bro"
                })
            }
            const result = streamEventSchema.safeParse(parsed);
            if(!result.success){
                return res.code(400).send({
                    error:"Invalid stream format bro",
                    details: result.error.issues
                })
            }

            const event = result.data;
            if(event.event === "complete"){
                if(event.document_id !== document_id){
                    return res.code(400).send({
                        error: "Document ID Mismatch"
                    })
                }
                if(event.block_count !== total){
                    return res.code(400).send({
                        error:"Block Count Mismatch bro"
                    })
                }
                completed = true;
                continue;
            }
            if(event.block.document_id !== document_id){
                return res.code(400).send({
                    error: "Block Document ID mismatch bro(this shi is so tuff)"
                })
            }
            let b : NormalizedBlock = event.block;
            batch.push(b);
            total++;

            if(batch.length >= BATCH_SIZE){
                const job = createBatchJob(document_id,batch_number,batch);
                await enqueueJob(job);
                batch_number++;
                batch = [];
            }

        }
        if(!completed){
            return res.code(400).send({
                error:"Missing complete event"
            })
        }
        //if there are 800 blocks, 500 is done rest would be there right, for that we are doing this (DSA hahaha)
        if(batch.length > 0){
            const job = createBatchJob(document_id,batch_number,batch);
            await enqueueJob(job);
            batch_number++;
        }
        console.log(`Document ID:${document_id} hasssssss  ${batch_number} batches total baaakaaaa`);
        await emit({
            type:"stream_completed",
            document_id:document_id,
            total_block_jobs: batch_number
        })
        return res.code(200).send({
            document_id,
            block_count: total,
            status:"accepted"
        });


    })
}


function createBatchJob(document_id:string,batch_number:number,blocks: NormalizedBlock[]) : BlockIngestionJob{
    return {
        document_id: document_id,
        batchID: `${document_id}:batch:${batch_number}`,
        start_seq: blocks[0].sequence,
        end_seq: blocks[blocks.length-1].sequence,
        blocks
    }
}

async function enqueueJob(job:BlockIngestionJob){
    await ingestionQueue.add("ingest-block-batch", job,{
        jobId: job.batchID,
        attempts : 5,
        backoff: {
            type: "exponential",
            delay: 1000
        },
        removeOnComplete:true,
        removeOnFail:false
    })

    await embedderQueue.add("embed-block-batch",job,{
        jobId: job.batchID,
        attempts: 5,
        backoff: {
            type:"exponential",
            delay:1000
        },
        removeOnComplete:true,
        removeOnFail:false
    })
}
