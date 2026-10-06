
import { State } from "../models/state";
import { redis_state , redis_document} from "../queue/redis";

type Stage = "postgre" | "qdrant";

export class StateManagementService{
    async started(document_id: string){
        await redis_state.hsetnx(`doc:${document_id}`,"status","PROCESSING")
        return {
            status: "PROCESSING"
        }
    }

    async analyzerCompleted(document_id : string, block_jobs: number){
        await redis_state.hset(`doc:${document_id}`,"total_block_jobs", block_jobs);
        return await this.checkDone(document_id);
    }
    async blockDone(document_id: string, batch_id: string, stage: Stage){
        await redis_state.sadd(`doc:${document_id}:${stage}`,batch_id);
        return await this.checkDone(document_id);
    }

    async blockFailed(document_id: string, batch_id: string, stage: Stage){
        await redis_state.sadd(`doc:${document_id}:${stage}`,batch_id);
        return await this.checkDone(document_id);
    }
    private async checkDone(document_id : string): Promise<{status: string}>{
        const total_blocks = await redis_state.hget(`doc:${document_id}`,"total_block_jobs");
        let flag = false;
        if(total_blocks === null){
            return {
                status: "PROCESSING"
            };
        }
        const total = Number(total_blocks);
        const [pg, failed_pg, qdrant, failed_qdrant] = await Promise.all([
            redis_state.scard(`doc:${document_id}:pg`),
            redis_state.scard(`doc:${document_id}:pg_failed`),
            redis_state.scard(`doc:${document_id}:qdrant`),
            redis_state.scard(`doc:${document_id}:qdrant_failed`),

        ])

        if(pg + failed_pg < total || qdrant + failed_qdrant < total){
            return {
                status: "PROCESSING"
            };
        }

        const final_status = failed_pg + failed_qdrant > 0 ? "PARTIAL" : "COMPLETED";
        const caller = await redis_state.set(`doc:${document_id}:final`,final_status,"NX");
        if(caller === "OK"){
            await redis_state.hset(`doc:${document_id}`,"status",final_status);
            await redis_document.publish(`doc-done:${document_id}`, final_status);
            flag = true;
        }
        if(flag){
            return {
                status: "COMPLETED"
            }
        }
        return {
            status: "PROCESSING"
        }
        

    }
    async getState(document_id: string){
        const[document, pg, failed_pg, qdrant, failed_qdrant] = await Promise.all([
            redis_state.hgetall(`doc:${document_id}`),
            redis_state.scard(`doc:${document_id}:pg`),
            redis_state.scard(`doc:${document_id}:pg_failed`),
            redis_state.scard(`doc:${document_id}:qdrant`),
            redis_state.scard(`doc:${document_id}:qdrant_failed`),  
        ]);
        if(!document.status) {
            return null
        };
        return {
            document: document_id,
            status : document.status,
            total_block_job : document.total_block_jobs ? Number(document.total_block_jobs) : null,
            postgres : {done: pg, failed: failed_pg},
            qdrant : {done : qdrant, failed: failed_qdrant}

        }

    }


}

