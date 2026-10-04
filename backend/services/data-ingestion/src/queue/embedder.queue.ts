import { Queue} from "bullmq";
import {redis_embedder} from "./redis.js";

export const embedderQueue = new Queue("embeddings-ready",{
    connection:redis_embedder
})