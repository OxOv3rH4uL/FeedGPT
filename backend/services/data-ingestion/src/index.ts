import { buildApp } from "./app";

const app = buildApp()

const start = async() =>{
    try{
        await app.listen({port:9998});
        console.log("Server is running periya bhai")
    }catch(err){
        app.log.error(err);
        console.error(err);
    }
}

start();