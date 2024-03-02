import { readFileSync } from "fs";
import { llmSelector } from "../main.js";

/**
 * Usage example
 */
async function main() {
    // I've got this HTML from https://www.whatismyip.com/
    const example = readFileSync('myip_example.html', 'utf8');
    for await (const res of llmSelector(example, "What is my IP", "An element that contains my IP address", "IP address")) {
        console.log(JSON.stringify(res));
        console.log(res.result.toString());
        res.save();
        return;
    }
}

main().then(() => console.log('done')).catch(console.error);