import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null
})

export const redis_state = new IORedis({
    host: process.env.REDIS_STATE_HOST,
    port: Number(process.env.REDIS_STATE_PORT)
})

