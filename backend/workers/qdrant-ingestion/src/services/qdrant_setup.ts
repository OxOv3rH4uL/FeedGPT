import { qdrant} from "../utils/qdrant";
import { QDRANT_CONFIG } from "../config/qdrant_config";

export async function qdrantCollectionSetup():  Promise<void>{
    const collections = await qdrant.collectionExists(QDRANT_CONFIG.collectionName);
    if(collections.exists === true){
        console.log("FeedGPT Collection already exist");
        return;
    }
    await qdrant.createCollection(QDRANT_CONFIG.collectionName,{
        vectors:{
            dense:{
                size: QDRANT_CONFIG.vectorSize,
                distance: "Cosine"
            }
        },
        sparse_vectors: {bm25: {modifier: "idf"}}
    })
    await qdrant.createPayloadIndex(QDRANT_CONFIG.collectionName,{
        field_name: "document_id",
        field_schema: "keyword"
    })


    console.log("FeedGPT Collection Created bro!!");
}