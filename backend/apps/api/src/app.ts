import fastify from "fastify";
import multipart from "@fastify/multipart";
import { documentRoutes } from "./modules/document/documents.routes";

export function buildApp(){
    const app= fastify({
        logger:true
    })
    app.register(multipart,{
        limits:{
            fileSize: 20*1024*1024
        }
    })
    app.get("/health", async()=>{
        return {
            status:"alive broski"
        };
    });

    app.register(documentRoutes)


    return app
}