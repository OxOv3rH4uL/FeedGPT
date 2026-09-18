import { Queue } from "bullmq";
import { redis } from "../redis.js";

export const imageQueue = new Queue("image-processing", {
  connection: redis,
});