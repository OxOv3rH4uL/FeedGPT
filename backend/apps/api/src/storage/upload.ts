import { PutObjectCommand } from "@aws-sdk/client-s3";
import { minioClient, bucket } from "./minio.js";

export async function uploadFile() {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: "test/hello.txt",
    Body: "Hello broo yena panra",
    ContentType: "text/plain",
  });

  await minioClient.send(command);

  console.log("uploaded successfully");
}