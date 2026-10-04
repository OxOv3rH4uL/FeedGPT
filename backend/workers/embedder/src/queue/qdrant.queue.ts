import {Queue} from "bullmq";
import { qdrant_redis } from './../redis';

export const qdrantQueue = new Queue("qdrant-vector",{
    connection: qdrant_redis
})

