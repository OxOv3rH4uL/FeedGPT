import { Queue} from "bullmq";
import {redis} from "./redis.js";

export const ingestionQueue = new Queue("data-ingestion",{
    connection: redis
})

