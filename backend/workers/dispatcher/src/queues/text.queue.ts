import { Queue } from "bullmq";
import { redis } from "../redis.js";

export const textQueue = new Queue("text-processing", {
  connection: redis,
});