import {AutoTokenizer, AutoModel} from "@huggingface/transformers"

export const embed_model = "Xenova/bge-small-en-v1.5";

let tokenizerPromise : ReturnType<typeof AutoTokenizer.from_pretrained> | null = null;
let embedderPromise : ReturnType<typeof AutoModel.from_pretrained> | null = null;



export function getTokenizer(){
    if(!tokenizerPromise){
        tokenizerPromise = AutoTokenizer.from_pretrained(embed_model);

    }
    return tokenizerPromise;
}

export function getEmbedModel(){
    if(!embedderPromise){
        embedderPromise = AutoModel.from_pretrained(embed_model);
    }
    return embedderPromise;
}

export async function countTokens(text: string) : Promise<number>{
    const tokenizer = await getTokenizer();
    const encoded = tokenizer(text,{
        add_special_tokens:true
    })

    return encoded.input_ids.size;
    
}