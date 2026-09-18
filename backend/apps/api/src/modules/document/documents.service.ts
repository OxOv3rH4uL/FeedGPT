import { PutObjectCommand } from "@aws-sdk/client-s3";
import { minioClient,bucket } from "../../storage/minio";
import {prismaClient} from "../../lib/prisma"
import { documentQueue } from "../../queue/document.queue.js";

export class DocumentService{
    async uploadDocument(fileName:string,mimetype:string,fileBuffer: Buffer){
        const docID = crypto.randomUUID();
        const prisma = prismaClient;
        const storageKey = `documents/${docID}/original.pdf`;
        await minioClient.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: storageKey,
                Body: fileBuffer,
                ContentType: mimetype
            })
        )
        const document = await prisma.document.create({
            data:{
                id: docID,
                name: fileName,
                url: storageKey
            }
        })
        console.log(docID);
        await documentQueue.add("process-document",{
            documentID: docID
        })
        return document;

    }
}