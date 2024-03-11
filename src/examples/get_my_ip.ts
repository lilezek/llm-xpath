import { readFileSync } from "fs";
import { LLMSelector } from "../main.js";
import DOMParser from "./providers/dom_parser_provider.js";
import XMLParser from "./providers/xml_parser_provider.js";
import XPath from "./providers/xpath_provider.js";
import dotenv from 'dotenv';
dotenv.config();

const llmSelector = new LLMSelector({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    domParser: DOMParser,
    xmlParser: XMLParser,
    xpath: XPath,
});


/**
 * Usage example
 */
async function main() {
    // I've got this HTML from https://www.whatismyip.com/
    const example = readFileSync('myip_example.html', 'utf8');
    for await (const res of llmSelector.findXPath(example, "What is my IP", "An element that contains my IP address", "IP address")) {
        console.log(JSON.stringify(res));
        console.log(res.result.toString());
        await res.save();
        return;
    }
}

main().then(() => console.log('done')).catch(console.error);