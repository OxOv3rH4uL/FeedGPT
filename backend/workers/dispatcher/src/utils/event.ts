import IORedis  from 'ioredis';
import {Queue} from "bullmq";
import { redis_state } from '../redis';

const eventsQueue = new Queue("document_events",{
    connection: redis_state,
    defaultJobOptions:{
        attempts: 5,
        backoff: {type:"exponential",delay: 1000}
    }
})


export type DocEvent = 
    {
        type:"started",
        document_id: string
    } | 
    {
        type:'stream_completed',
        document_id: string,
        total_block_jobs: Number
    } | 
    {
        type:'pg_done',
        document_id: string,
        batch_id: string
    } | 
    {
        type:'qdrant_done',
        document_id: string,
        batch_id: string
    } | 
    {
        type:'block_failed',
        document_id: string,
        batch_id: string,
        stage : "postgre" | "qdrant"
    }

export const emit = (e: DocEvent) => {
    eventsQueue.add("evt",e);
}