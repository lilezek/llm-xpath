import FilterNodes from './dom_steps/filter_nodes.js';
import FilterAttributes from './dom_steps/filter_attributes.js';
import FilterEmptyNodes from './dom_steps/filter_empty_nodes.js';
// import ExtractLists from './dom_steps/extract_lists.js';
import TrimText from './dom_steps/trim_text.js';
// import FilterNonEnglishClasses from './dom_steps/filter_non_english_classes.js';
import SubtreeStrategy from './chunking/subtree_strategy.js';
import GroupingStrategy from './chunking/grouping_strategy.js';
import { ChatGPTChat } from './LLM/chatgpt.js';
import XPathResult from './xPathResult.js';
import ClassMatchToClassContains from './xpath_steps/class_match_to_class_contains.js';
import SortingStrategy from './chunking/sorting_strategy.js';
import FilterFrameworkClasses from './dom_steps/filter_framework_classes.js';
import ExtractReadableText from './dom_steps/extract_text.js';
import { XPath } from './dependencies/xpath.js';
import { DOMParser, HTMLElement } from './dependencies/dom.js';
import { XMLParser } from './dependencies/xml.js';

const domPreprocessing = [
    FilterNodes,
    FilterAttributes,
    // FilterNonEnglishClasses,
    FilterFrameworkClasses,
    FilterEmptyNodes,
    TrimText,
    // ExtractLists,
];

const xpathPostprocessing = [
    ClassMatchToClassContains
];

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

export interface LLMSelectorOptions {
    openaiApiKey: string;
    xpath: XPath;
    domParser: DOMParser;
    xmlParser: XMLParser;
}

export class LLMSelector {
    private openaiApi: ChatGPTChat;
    private xpath: XPath;
    private domParser: DOMParser;
    private xmlParser: XMLParser;

    constructor(options: LLMSelectorOptions) {
        this.openaiApi = new ChatGPTChat(options.openaiApiKey);
        this.xpath = options.xpath;
        this.domParser = options.domParser;
        this.xmlParser = options.xmlParser;
    }

    private find(query: string, chunk: string) {
        const dom = this.xmlParser.parse(`<div>${chunk}</div>`);
        const found = this.xpath.select(query, dom);
        return found;
    }

    async *findXPath(
        htmlOrXml: string | Buffer,
        context: string,
        elementToFind: string,
        hint: string = elementToFind,
        probabilityCut = 0.66) {
        const userInput = `Context: ${context}.\nElement to find: ${elementToFind}`;
        const root = this.domParser.parse(htmlOrXml.toString());

        try {
            const load = await XPathResult._load(userInput);
            const [found] = this.find(load.xpath, htmlOrXml.toString());
            if (found) {
                load.result = found;
                yield load;
            }
        } catch (e) {
            // Ignore ENOENT
            if (!(e instanceof Error && 'code' in e && e.code === 'ENOENT')) {
                throw e;
            }
        }

        domPreprocessingStep(root);
        // fs.writeFileSync('filtered_example.html', root.toString());

        const sizeLimit = 3000;
        const nodeBundles = SortingStrategy(GroupingStrategy(SubtreeStrategy(root, sizeLimit), sizeLimit), hint);

        let highestProbResponse = null;
        let i = -1;
        for (const nodeBundle of nodeBundles) {
            const chunk = nodeBundle.map(n => n.toString()).join('');
            i++;
            // fs.writeFileSync(`chunks/${i}.html`, chunk);
            let llmResponse = await this.openaiApi.processChunk(chunk, userInput);

            // Return immediately if the response is above the probability cut
            if (llmResponse.p >= probabilityCut) {
                const xpath = XPathPostprocessingStep(llmResponse.xpath ?? '');
                if (!xpath) {
                    continue;
                }

                const [found] = this.find(xpath, htmlOrXml.toString());

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

            const [found] = this.find(xpath, htmlOrXml.toString());

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

    /**
     * Given a list of elements, find the element that is most likely to be the one the user is looking for.
     */
    async findInList(htmlOrXml: string[], context: string, elementToFind: string) {
        const userContext = `Context: ${context}.\nFind: ${elementToFind}`;
        const elements = htmlOrXml.map(s => this.domParser.parse(s.trim()));

        const listString = elements.map((el) => {
            const tagName = el.tagName === null ? (el.childNodes[0] as HTMLElement).tagName : el.tagName;
            const trimmed = tagName + ' ' + ExtractReadableText(el).join(' ').trim();
            // Remove consecutive spaces and new lines
            return trimmed.replace(/\s+/g, ' ');
        });
        const index = await this.openaiApi.findInList(listString, userContext);

        return index;
    }
}

