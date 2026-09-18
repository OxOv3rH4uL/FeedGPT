import { Queue } from "bullmq";
import { redis } from "../redis.js";

export const codeQueue = new Queue("code-processing", {
  connection: redis,
});