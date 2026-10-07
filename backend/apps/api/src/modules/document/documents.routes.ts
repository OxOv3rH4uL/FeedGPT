import { DocumentService } from "./documents.service.js";
import { FastifyInstance } from "fastify";
import { waitForProcessing } from "../../utils/document_subscriber.js";

export async function documentRoutes(app:FastifyInstance){
    const documentService = new DocumentService();
    app.post("/documents",async(req,res)=>{
        const file = await req.file();

        if(!file){
            return res.code(400).send({
                error:"File not uploaded"
            })
        }
        const fileName =
         file.filename;
        const mimeType = file.mimetype;
        if(mimeType != "application/pdf"){
            return res.code(400).send({
                error: "Only PDFs are supported"
            })
        }
        try{

            const filebuffer = await file.toBuffer();
            const documentz = await documentService.uploadDocument(fileName,mimeType,filebuffer);
            const document_status = await waitForProcessing(documentz.id);
            if(document_status !== "COMPLETED"){
                return res.code(400).send({
                    "message":"Document failed to process but successfully uploaded i believe lmao"
                })
            }else{
                return res.code(200).send(document)  
            }
        }catch(error){
            req.log.error(error);
            return res.code(500).send({
                error: "Failed to upload document"
            })
        }
    })
}