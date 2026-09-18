import {z} from "zod";

export const normalizedBlockSchema = z.object({
    block_id: z.string().min(1),
    document_id: z.string().min(1),
    type: z.enum([
        "text",
        "table",
        "image",
        "other"
    ]),
    element_type: z.string().min(1),
    page: z.number().int().nullable(),
    sequence: z.number().int(),
    coords: z.array(z.number()).length(4).nullable(),
    text: z.string().nullable(),
    metadata: z.record(z.string(),z.unknown())
})

export const blockEventSchema = z.object({
    event: z.literal("block"),
    block: normalizedBlockSchema
})

export const completeEventSchema = z.object({
    event: z.literal("complete"),
    document_id: z.string().min(1),
    block_count: z.number().int().nonnegative()
})

export const streamEventSchema =
    z.discriminatedUnion(
        "event",
        [
            blockEventSchema,
            completeEventSchema,
        ],
    );

export type NormalizedBlock =
    z.infer<typeof normalizedBlockSchema>;

export type StreamEvent =
    z.infer<typeof streamEventSchema>;