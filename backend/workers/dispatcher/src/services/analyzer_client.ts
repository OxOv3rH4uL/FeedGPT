import dotenv from "dotenv";

dotenv.config();


export class AnalyzeClient{
    async analyze(documentID:string){
        const url = process.env.ANALYZER_URL;
        const response = await fetch(url+"/analyze/"+documentID+"/stream", {
            method:"POST",
        })
        if(response.status != 200){
            throw Error(
                "Analyzer Service is not working maybe"
            )
        }
        return response.json();
    }
}