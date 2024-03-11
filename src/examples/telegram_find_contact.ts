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
    const example = readFileSync('telegram_example.html', 'utf8');
    for await (const res of llmSelector.findXPath(example, "Telegram chat page", "The contact Alfredo", "Alfredo")) {
        console.log(JSON.stringify(res));
        await res.save();
        return;
    }
}

main().then(() => console.log('done')).catch(console.error);