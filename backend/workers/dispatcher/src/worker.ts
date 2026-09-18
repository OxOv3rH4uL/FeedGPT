import { Worker } from "bullmq";
import {redis} from "./redis.js";
import dotenv from "dotenv";

import { AnalyzeClient } from "./services/analyzer_client.js";

dotenv.config();

const analyzer = new AnalyzeClient();
const worker = new Worker("document-processing",
    async(job) => {
        console.log("Job Received: ", job.name);
        const {documentID} = job.data;
        console.log("Sending document to analyzer: ",documentID);
        const result = await analyzer.analyze(documentID);
        console.log(
            "Analyzer result:",
            result,
        );

        return result;
    },{
        connection: redis
    }
)

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

console.log("Dispatcher worker started");