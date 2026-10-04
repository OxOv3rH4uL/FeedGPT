import { getTokenizer,getEmbedModel } from "./tokenizer";
import { EmbedChunk } from "../models/chunk";
import { VectorChunk } from "../models/vector_chunk";
import { EMBEDDING_CONFIG } from "../config/embedding_config";

export class EmbedService{
    async embed(chunks: EmbedChunk[]): Promise<VectorChunk[]>{
        if(chunks.length == 0){
            return [];
        }
        const res : VectorChunk[] = [];
        const tokenizer = await getTokenizer();
        const model = await getEmbedModel();
        for(let start = 0 ; start < chunks.length ; start += EMBEDDING_CONFIG.batchSize){
            const batch = chunks.slice(start, start+ EMBEDDING_CONFIG.batchSize);
            const texts = batch.map(chunk=>chunk.text);
            const input = tokenizer(texts,{
                padding:true,
                truncation:true
            })
            const op = await model(input);
            const embeddings = op.sentence_embedding;
            for(let i = 0; i < batch.length; i++){
                const embedding = Array.from(embeddings[i].data as number[]);
                res.push({
                    chunk: batch[i],
                    embeddings: embedding
                })
            }
        }
        return res;
        // for(let vc in res){
        //     //we will push the embedded chunk/vector chunk to the qdrant queue
        // }
    }
}