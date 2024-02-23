import { parse } from 'node-html-parser';
import xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';
import FilterNodes from './steps/filter_nodes.js';
import FilterAttributes from './steps/filter_attributes.js';
import FilterEmptyNodes from './steps/filter_empty_nodes.js';
import ExtractLists from './steps/extract_lists.js';
import TrimText from './steps/trim_text.js';
import FilterNonEnglishClasses from './steps/filter_non_english_classes.js';
import SubtreeStrategy from './chunking/subtree_strategy.js';
import GroupingStrategy from './chunking/grouping_strategy.js';
import LLMChatProcessChunk from './LLM/llm_chat.js';

const example = fs.readFileSync('twitch_example.html', 'utf8');
const root = parse(example);

const size_orig = root.toString().length;
FilterNodes(root);
const size_filter_nodes = root.toString().length;
FilterAttributes(root);
const size_filter_attrs = root.toString().length;
FilterNonEnglishClasses(root);
const size_filter_classes = root.toString().length;
FilterEmptyNodes(root);
const size_filter_empty = root.toString().length;
TrimText(root);
const size_trim_text = root.toString().length;
ExtractLists(root);

console.log(`Original size: ${size_orig} bytes`);
console.log(`Filtered size: ${size_filter_nodes} bytes`);
console.log(`Filtered attributes: ${size_filter_attrs} bytes`);
console.log(`Filtered non-english classes: ${size_filter_classes} bytes`);
console.log(`Filtered empty nodes: ${size_filter_empty} bytes`);
console.log(`Trimmed text: ${size_trim_text} bytes`);

fs.writeFileSync('twitch_example_filtered.html', root.toString());

function find(query: string, chunk: string) {
    const dom = new DOMParser().parseFromString(`<div>${chunk}</div>`);
    const found = xpath.select(query, dom);
    return found;
}

const sizeLimit = 3000;
const chunks = GroupingStrategy(SubtreeStrategy(root, sizeLimit), sizeLimit);

async function main() {
    let i = 0;
    for (const chunk of chunks) {
        fs.writeFileSync(`chunks/twitch_example_${i++}.html`, chunk);
        const llmResponse = await LLMChatProcessChunk(chunk, "The twitch stream. Find the chat input box. Do not find any other input.");
        if (!llmResponse) {
            console.log('No response');
            continue;
        }

        const found = find(llmResponse, root.toString());
        if (found) {
            if (found instanceof Array && found.length == 0) {
                continue;
            }
            console.log(`Found in chunk ${i-1}`);
            console.log(found.toString());
            console.log(llmResponse);
            break;
        }
    }
}

main().then(() => console.log('done'));



