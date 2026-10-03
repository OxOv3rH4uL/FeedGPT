import {prisma} from "../services/prisma";
import { Prisma } from "../../../../apps/api/prisma/generated/prisma/client";
import type { BlockIngestionJob } from "../models/ingestion_job";
import type { NormalizedBlock } from "../models/block";

export class BlockIngestionService{
    async ingest(job: BlockIngestionJob): Promise<void>{
        await prisma.block.createMany({
            data: job.blocks.map((block :NormalizedBlock)=>({
                document_id: block.document_id,
                type: block.type,
                element_type: block.element_type,
                page: block.page,
                sequence: block.sequence,
                coords: block.coords === null ? Prisma.DbNull : block.coords,
                text: block.text,
                metadata: block.metadata as Prisma.InputJsonValue
            })),
            skipDuplicates: true
        });
    }
}

