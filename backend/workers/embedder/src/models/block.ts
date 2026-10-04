export type BlockType = "text" | "table" | "image" | "other"


export interface NormalizedBlock{

    block_id : string;
    document_id:string;
    type: BlockType;
    element_type: string;
    page: number | null;
    sequence : number;
    coords: number[] | null;
    text: string | null;
    metadata: Record<string,unknown>
    
}