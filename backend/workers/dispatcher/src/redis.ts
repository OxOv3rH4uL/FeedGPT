import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// const port = process.env.REDIS_PORT;
// console.log(port);

export const redis = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null
})

export const redis_state = new IORedis({
    host: process.env.REDIS_STATE_HOST,
    port: Number(process.env.REDIS_STATE_PORT),
    maxRetriesPerRequest: null
})

