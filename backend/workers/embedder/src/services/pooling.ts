import type { Tensor } from "@huggingface/transformers";

export class PoolingService{
    meanPool(last:Tensor, attention_mask: Tensor): number[][]{
        const hidden = last.data as Float32Array;
        const mask = attention_mask.data as BigInt64Array;
        
        const [batchSize, sequenceLength, dimensions] = last.dims;
        const results: number[][] = [];
        
        for(let batch = 0 ; batch < batchSize ; batch++){
            const embedding = new Array<number>(dimensions).fill(0);
            let validTokens = 0;
            for(let token = 0; token < sequenceLength; token++){
                const maskIndex = (batch * sequenceLength) + token;
                if(mask[maskIndex] == 1n){
                    validTokens++;
                    const offset = (batch * sequenceLength * dimensions) + (token * dimensions);
                    for (let dimension = 0; dimension< dimensions; dimension++){
                        embedding[dimension] += hidden[offset+dimension];
                    }
                }
            }
            if(validTokens == 0){
                throw new Error("No valid tokens found broo for embedding");
            }
            for(let dim = 0; dim < dimensions; dim++){
                embedding[dim] /= validTokens;
            }
            results.push(embedding);
        }
        return results;
    }
    normalizer(embedding: number[]) : number[]{
        let mag = 0;
        for(const val of embedding){
            mag += val * val;
        }
        mag = Math.sqrt(mag);
        if(mag == 0){
            throw new Error("Cannot normalize zero vector");
        }
        return embedding.map(value=>value/mag);
    }
}