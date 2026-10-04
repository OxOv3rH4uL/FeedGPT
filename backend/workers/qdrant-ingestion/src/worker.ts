import { qdrantCollectionSetup } from "./services/qdrant_setup";

async function main(){
    await qdrantCollectionSetup();
}

main();