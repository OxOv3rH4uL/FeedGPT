import { getTokenizer,getEmbedModel } from "./services/tokenizer";
import { PoolingService } from "./services/pooling";
async function main(){
    const tokenizer = await getTokenizer();
    const model = await getEmbedModel();
    const pool = new PoolingService();
    const text = "lemme change few stuffs and i will check, hope it is cached now hahahahahaha"
    const input = tokenizer(text,{
        padding:true,
        truncation:true
    })
    const op = await model(input);
    // console.log("model output");
    // console.dir(op,{depth:2});
    const embedding = pool.meanPool(op.last_hidden_state,input.attention_mask);
    // const normalized = pool.normalizer(embedding);
    // console.log("First 10 values:", normalized.slice(0, 10));

    // const magnitude = Math.sqrt(
    //     normalized.reduce(
    //         (sum, value) => sum + value * value,
    //         0
    //     )
    // );

    // console.log("Magnitude:", magnitude);
}
main().catch((error) => {
    console.error("Embedding test failed:", error);
    process.exit(1);
});

// import { AutoTokenizer } from "@huggingface/transformers";

// async function main() {
//     console.log("Loading tokenizer...");

//     const tokenizer = await AutoTokenizer.from_pretrained(
//         "Xenova/bge-small-en-v1.5"
//     );

//     console.log("Tokenizer loaded!");

//     const output = tokenizer(
//         "This is a test sentence for FeedGPT.",
//         {
//             padding: true,
//             truncation: true
//         }
//     );

//     console.log("Tokenization successful!");
//     console.dir(output, { depth: 2 });
// }

// main().catch((error) => {
//     console.error("Test failed:", error);
// });