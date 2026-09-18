import { buildApp } from "./app";

const app = buildApp()

const start = async() =>{
    try{
        await app.listen({port:8000});
        console.log("Server is running periya bhai")
    }catch(err){
        console.error(err);
    }
}

start();