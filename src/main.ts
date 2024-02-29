import { parse } from 'node-html-parser';
import xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';
import FilterNodes from './dom_steps/filter_nodes.js';
import FilterAttributes from './dom_steps/filter_attributes.js';
import FilterEmptyNodes from './dom_steps/filter_empty_nodes.js';
import ExtractLists from './dom_steps/extract_lists.js';
import TrimText from './dom_steps/trim_text.js';
import FilterNonEnglishClasses from './dom_steps/filter_non_english_classes.js';
import SubtreeStrategy from './chunking/subtree_strategy.js';
import GroupingStrategy from './chunking/grouping_strategy.js';
import LLMChatProcessChunk from './LLM/llm_chat.js';
import XPathResult from './xPathResult.js';
import ClassMatchToClassContains from './xpath_steps/class_match_to_class_contains.js';

const domPreprocessing = [
    FilterNodes,
    FilterAttributes,
    FilterNonEnglishClasses,
    FilterEmptyNodes,
    TrimText,
    ExtractLists,
];

const xpathPostprocessing = [
    ClassMatchToClassContains
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

async function* llmSelector(htmlOrXml: string|Buffer, context: string, elementToFind: string) {
    const userInput = `Context: ${context}. Element to find: ${elementToFind}`;

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
    for (const step of domPreprocessing) {
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
        
        for (const step of xpathPostprocessing) {
            llmResponse = step(llmResponse);
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

/**
 * Usage example
 */
async function main() {
    const example = fs.readFileSync('telegram_example.html', 'utf8');
    for await (const res of llmSelector(example, "Telegram chat page", "input field for message")) {
        console.log(JSON.stringify(res));
        res.save();
        return;
    }
}

main().then(() => console.log('done')).catch(console.error);
