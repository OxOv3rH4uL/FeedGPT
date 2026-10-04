import type { NormalizedBlock } from "../models/block";
import type { EmbedChunk } from "../models/chunk";
import { randomUUID } from "crypto";
import { countTokens, getTokenizer } from "./tokenizer";
import { CHUNKING_CONFIG } from "../config/chunking_config";


export class ChunkService{
    async chunkBlock(block: NormalizedBlock): Promise<EmbedChunk[]>{
        if(!block.text?.trim()){
            return [];
        }
        const text = block.text.trim();
        const tokenCount = await countTokens(text);

        if(tokenCount <= CHUNKING_CONFIG.targetTokens){
            return [
                this.createChunk(
                    block,text,0,tokenCount
                )
            ];
        }
        const sentences = this.sentenceSplit(text);
        return this.buildChunks(block,sentences);
    }

    private createChunk(block: NormalizedBlock, text: string, chunkIndex: number, tokenCount: number) : EmbedChunk {
        return {
            chunk_id: randomUUID(),
            block_id: block.block_id,
            document_id: block.document_id,
            sequence: block.sequence,
            chunk_index: chunkIndex,
            text,
            token_count: tokenCount,
            page: block.page,
            metadata: block.metadata
        }
    }

    private sentenceSplit(text: string) : string[]{
        const segmenter = new Intl.Segmenter("en",{
            granularity:"sentence"
        })

        return Array.from(
            segmenter.segment(text),
            segment => segment.segment.trim()
        ).filter(Boolean)
    } 

    private async buildChunks(block:NormalizedBlock,sentences:string[]) : Promise<EmbedChunk[]>{
        const chunks: EmbedChunk[] = [];
        for(let sentence in sentences){
            const tokenCount = await countTokens(sentence);
            if(tokenCount <= CHUNKING_CONFIG.targetTokens){
                chunks.push(this.createChunk(block,sentence,chunks.length,tokenCount));
                continue;
            }
            const large_sentence_split:string[] = await this.wordSplitter(sentence);
            const rec_chunks = await this.buildChunks(block,large_sentence_split);
            chunks.push(...rec_chunks);
        }
        return chunks;
    }

    private async wordSplitter(sentence:string): Promise<string[]>{
        const tokenizer = await getTokenizer();
        const encoded = tokenizer(sentence, {
            add_special_tokens: false
        })
        const words : string[] = [];
        const tokenIds = Array.from(encoded.input_ids.data);
        const chunkSize = CHUNKING_CONFIG.targetTokens;
        const overlap = CHUNKING_CONFIG.overlapTokens;
        const window = chunkSize - overlap;
        for(let start = 0 ; start < tokenIds.length ; start += window){
            const end = Math.min(start + chunkSize , tokenIds.length);
            const chunked = tokenIds.slice(start,end);
            const text = tokenizer.decode(chunked,{
                skip_special_tokens:true
            }).trim();
            if(text){
                words.push(text);
            }
            if(end >= tokenIds.length){
                break;
            }
        }
        return words;
    }
}

