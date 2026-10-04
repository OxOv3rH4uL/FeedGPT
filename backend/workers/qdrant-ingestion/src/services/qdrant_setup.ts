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
            size: QDRANT_CONFIG.vectorSize,
            distance: "Cosine"
        }
    })
    console.log("FeedGPT Collection Created bro!!");
}