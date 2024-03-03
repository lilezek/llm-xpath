import { HTMLElement, parse } from 'node-html-parser';
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

const noop = () => { };

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

function domPreprocessingStep(root: HTMLElement) {
    for (const step of domPreprocessing) {
        step(root);
    }
}

function XPathPostprocessingStep(query: string) {
    for (const step of xpathPostprocessing) {
        query = step(query);
    }
    return query;
}

function first(list: xpath.SelectReturnType) {
    if (list instanceof Array) {
        if (list.length > 0) {
            return list[0];
        }
    } else {
        return list;
    }
    return null;
}

export async function* llmSelector(
    htmlOrXml: string | Buffer,
    context: string,
    elementToFind: string,
    hint: string = elementToFind,
    probabilityCut = 0.66) {
    const userInput = `Context: ${context}.\nElement to find: ${elementToFind}`;

    try {
        const load = XPathResult._load(userInput);
        const found = first(find(load.xpath, htmlOrXml.toString()));
        if (found) {
            load.result = found;
            yield load;
            return;
        }
    } catch (e) {
        // Ignore ENOENT
        if (!(e instanceof Error && 'code' in e && e.code === 'ENOENT')) {
            throw e;
        }
    }

    const root = parse(htmlOrXml.toString());
    domPreprocessingStep(root);

    const sizeLimit = 3000;
    const nodeBundles = SortingStrategy(GroupingStrategy(SubtreeStrategy(root, sizeLimit), sizeLimit), hint);

    let highestProbResponse = null;
    let i = -1;
    for (const nodeBundle of nodeBundles) {
        const chunk = nodeBundle.map(n => n.toString()).join('');
        i++;
        // fs.writeFileSync(`chunks/${i}.html`, chunk);
        let llmResponse = await LLMChatProcessChunk(chunk, userInput);

        // Return immediately if the response is above the probability cut
        if (llmResponse.p >= probabilityCut) {
            const xpath = XPathPostprocessingStep(llmResponse.xpath ?? '');
            if (!xpath) {
                continue;
            }

            const found = first(find(xpath, htmlOrXml.toString()));

            if (!found) {
                continue;
            }

            yield new XPathResult(
                xpath,
                userInput,
                found,
                sizeLimit,
                i,
            );
        }

        if (highestProbResponse === null || llmResponse.p > highestProbResponse.p) {
            highestProbResponse = llmResponse;
        }
    }

    if (highestProbResponse !== null) {
        const xpath = XPathPostprocessingStep(highestProbResponse.xpath ?? '');
        if (!xpath) {
            return;
        }

        const found = first(find(xpath, htmlOrXml.toString()));

        if (found) {
            yield new XPathResult(
                xpath,
                userInput,
                found,
                sizeLimit,
                i,
            );
        }
    }
}
