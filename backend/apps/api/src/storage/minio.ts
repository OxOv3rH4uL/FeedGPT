import { S3Client, PutObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();


const endpoint = process.env.MINIO_ENDPOINT;
const access_key = process.env.MINIO_ACCESS_KEY;
const secret_key = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET;

if (!endpoint || !access_key || !secret_key || !bucket) {
  throw new Error("MinIO environment variables are not configured. Please kindly check");
}

export const minioClient = new S3Client({
    endpoint,
    credentials:{
        accessKeyId:access_key,
        secretAccessKey: secret_key,
    },
    forcePathStyle:true //avoid dns issues i hope
})

export {bucket}


