import { buildApp } from "./app";
import { CheckStatus } from "./queue/state.queue";

const app = buildApp()

const start = async() =>{
    try{
        CheckStatus();
        await app.listen({port:9997});
        console.log("Server is running periya bhai")
    }catch(err){
        app.log.error(err);
        console.error(err);
    }
}

start();