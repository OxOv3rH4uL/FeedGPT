import fastify from "fastify";
import { ingestRoute } from "./routes/ingestion.route";

export function buildApp(){
    const app= fastify({
        logger:true
    })
    
    app.addContentTypeParser(
        "application/x-ndjson",
        function (_request, _payload, done) {
            done(null);
        },
    );
    
    app.get("/health", async()=>{
        return {
            status:"alive broski"
        };
    });
    app.register(ingestRoute)

    return app
}