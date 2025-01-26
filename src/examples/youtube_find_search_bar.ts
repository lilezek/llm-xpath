import { readFileSync } from "fs";
import { LLMSelector } from "../main.js";
import { HTMLElement, parse } from "node-html-parser";
import DOMParser from "./providers/dom_parser_provider.js";
import XMLParser from "./providers/xml_parser_provider.js";
import XPath from "./providers/xpath_provider.js";
import Storage from "./providers/storage_provider.js";
import dotenv from 'dotenv';
import { ChatGPTChat } from "../LLM/chatgpt.js";
dotenv.config();

const llmSelector = new LLMSelector({
    chat: new ChatGPTChat(process.env.OPENAI_API_KEY!),
    domParser: DOMParser,
    xmlParser: XMLParser,
    xpath: XPath,
    storage: Storage,
});



function findTabbableElements(root: HTMLElement) {
    const elements = root.querySelectorAll("a, button, input, select, textarea, [tabindex]");
    const tabableElements = [];
    for (const element of elements) {
        // Also the elements with tabindex=-1 are not navigable
        if (element.getAttribute("tabindex") === "-1") {
            continue;
        }
        // And a elements without href are not navigable
        if (element.tagName === "a" && !element.getAttribute("href")) {
            continue;
        }
        tabableElements.push(element);
    }

    return tabableElements;
}

/**
 * Usage example
 */
async function main() {
    // I've got this HTML from https://www.whatismyip.com/
    const example = readFileSync('youtube_example.html', 'utf8');
    const root = parse(example);
    const elements = findTabbableElements(root);
    const index = await llmSelector.findInList(elements.map(e => e.toString().trim()), "Youtube", "Search input bar");
    console.log(elements[index].rawTagName);
}

main().then(() => console.log('done')).catch(console.error);