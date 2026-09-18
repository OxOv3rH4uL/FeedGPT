// class BlockEvent(BaseModel):
//     event: Literal["block"] = "block"
//     block: NormalizedBlock

// class CompleteEvent(BaseModel):
//     event: Literal["complete"] = "complete"
//     document_id: str
//     block_count : str


import type { NormalizedBlock } from "./block";

export interface BlockEvent{
    event: "block";
    block: NormalizedBlock;
}

export interface CompleteEvent{
    event: "complete";
    document_id: string;
    block_count: number
}

export type StreamEvent = BlockEvent | CompleteEvent;