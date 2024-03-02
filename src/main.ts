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
import SortingStrategy from './chunking/sorting_strategy.js';

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

export async function* llmSelector(htmlOrXml: string|Buffer, context: string, elementToFind: string, hint: string = elementToFind) {
    const userInput = `Context: ${context}.\nElement to find: ${elementToFind}`;

    try {
        const load = XPathResult._load(userInput);
        const found = find(load.xpath, htmlOrXml.toString());
        if (isNode(found)) {
            load.result = found;
            yield load;
        } else if (found instanceof Array && found.length > 0) {
            load.result = found[0];
            yield load;
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
    const nodeBundles = SortingStrategy(GroupingStrategy(SubtreeStrategy(root, sizeLimit), sizeLimit), hint);

    let i = -1;
    for (const nodeBundle of nodeBundles) {
        const chunk = nodeBundle.map(n => n.toString()).join('');
        i++;
        // fs.writeFileSync(`chunks/${i}.html`, chunk);
        let llmResponse = await LLMChatProcessChunk(chunk, userInput);
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
