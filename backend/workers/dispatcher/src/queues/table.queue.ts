import { Queue } from "bullmq";
import { redis } from "../redis.js";

export const tableQueue = new Queue("table-processing", {
  connection: redis,
});

