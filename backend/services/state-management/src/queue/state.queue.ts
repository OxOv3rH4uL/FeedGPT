import  {Worker, Queue} from "bullmq";
import { StateManagementService } from "../service/state_manager";
import { redis_state, redis_dispatcher } from "./redis";


export function CheckStatus(){
    const state_manager = new StateManagementService();

    const worker = new Worker("document_events",
        async(job) =>{
            let final_result :{status: string} | undefined; 
            const e = job.data;
            console.log(job.data);
            if(e.type === "started"){
                final_result = await state_manager.started(e.document_id);
            }else if(e.type === "stream_completed"){
                final_result = await state_manager.analyzerCompleted(e.document_id,e.total_block_jobs);
            }else if(e.type === "pg_done"){
                final_result = await state_manager.blockDone(e.document_id, e.batch_id , "postgre");
            }else if(e.type === "qdrant_done"){
                final_result = await state_manager.blockDone(e.document_id,e.batch_id,"qdrant");
            }else if(e.type === "block_failed"){
                final_result = await state_manager.blockFailed(e.document_id, e.batch_id, e.stage);
            }
        },{
            connection: redis_state,
            concurrency: 20
        }
    )
    
    worker.on("failed", (job, err) => console.error("state event failed", job?.id, err));
    worker.on("error", (err) => console.error("state worker error", err));
}