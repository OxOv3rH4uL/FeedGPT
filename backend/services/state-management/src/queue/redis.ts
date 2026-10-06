import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis_state = new IORedis({
    host: process.env.REDIS_STATE_HOST,
    port: Number(process.env.REDIS_STATE_PORT),
    maxRetriesPerRequest: null
})

export const redis_dispatcher = new IORedis({
    host: process.env.REDIS_DISPATCHER_HOST,
    port: Number(process.env.REDIS_DISPATCHER_PORT),
    maxRetriesPerRequest:null
})
export const redis_document = new IORedis({
    host: process.env.REDIS_DOCUMENT_HOST,
    port: Number(process.env.REDIS_DOCUMENT_PORT),
    maxRetriesPerRequest:null
})

