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
import XPathResult from './xPathResult.js';

const processingSteps = [
    FilterNodes,
    FilterAttributes,
    FilterNonEnglishClasses,
    FilterEmptyNodes,
    TrimText,
    ExtractLists,
];

const noop = () => {};

const parser = new DOMParser({
    errorHandler: {
        warning: (msg) => noop,
        error: (msg) => noop,
        fatalError: (msg) => noop,
    },
});

function find(query: string, chunk: string) {
    const dom = parser.parseFromString(`<div>${chunk}</div>`);
    const found = xpath.select(query, dom);
    return found;
}

function isNode(node: any): node is Node {
    return node && 'nodeName' in node;
}

async function* llmSelector(htmlOrXml: string|Buffer, userInput: string) {
    try {
        const load = XPathResult._load(userInput);
        const found = find(load.xpath, htmlOrXml.toString());
        if (isNode(found)) {
            load.result = found;
            return load;
        } else if (found instanceof Array && found.length > 0) {
            load.result = found[0];
            return load;
        }
    } catch (e) {
        // Ignore ENOENT
        if (!(e instanceof Error && 'code' in e && e.code === 'ENOENT')) {
            throw e;
        }
    }

    const root = parse(htmlOrXml.toString());
    for (const step of processingSteps) {
        step(root);
    }

    const sizeLimit = 3000;
    const chunks = GroupingStrategy(SubtreeStrategy(root, sizeLimit), sizeLimit);

    // fs.writeFileSync('twitch_example_filtered.html', root.toString());

    let i = 0;
    for (const chunk of chunks) {
        fs.writeFileSync(`chunks/twitch_example_${i++}.html`, chunk);
        const llmResponse = await LLMChatProcessChunk(chunk, userInput);
        if (!llmResponse) {
            continue;
        }

        const found = find(llmResponse, htmlOrXml.toString());

        if (isNode(found)) {
            yield new XPathResult(
                llmResponse,
                userInput,
                found,
                sizeLimit,
                i,
            );
        } else if (found instanceof Array && found.length > 0) {
            yield new XPathResult(
                llmResponse,
                userInput,
                found[0],
                sizeLimit,
                i,
            );
        }
    }
    return null;
}

async function main() {
    const example = fs.readFileSync('telegram_example.html', 'utf8');
    for await (const res of llmSelector(example, "A web chat page with many users. Find Alfredo")) {
        console.log(JSON.stringify(res));
        if (res) {
            res.save();
        }
    }
}

main().then(() => console.log('done')).catch(console.error);
