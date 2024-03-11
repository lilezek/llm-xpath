enum NodeType {
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3,
    CDATA_SECTION_NODE = 4,
    PROCESSING_INSTRUCTION_NODE = 7,
    COMMENT_NODE = 8,
    DOCUMENT_NODE = 9,
    DOCUMENT_TYPE_NODE = 10,
    DOCUMENT_FRAGMENT_NODE = 11
}

export interface Node {
    nodeType: NodeType;
    childNodes: NodeSubtypes[] | NodeListOf<ChildNode>;
    textContent: string | null;

    // Implemented by node-html-parser
    rawText?: string;

    remove(): void;
}

export interface TextNode extends Node {
    nodeType: NodeType.TEXT_NODE;

    // Implemented by node-html-parser
    trimmedRawText?: string;
}

export interface Document extends HTMLElement {
    nodeType: NodeType.DOCUMENT_NODE;
}

export interface HTMLElement extends Node {
    nodeType: NodeType.ELEMENT_NODE | NodeType.DOCUMENT_NODE;
    tagName: string;
    classList: DOMTokenList;
    outerHTML: string;

    remove(): void;
    getAttribute(key: string): string | null;
    setAttribute(key: string, value: string): void;
    hasAttribute(key: string): boolean;
    removeAttribute(key: string): void;
}

type NodeSubtypes = HTMLElement | TextNode | Document;

export function isHtmlElement(node: Node): node is HTMLElement {
    return node.nodeType === NodeType.ELEMENT_NODE;
}

export interface DOMParserProvider {
    parse(html: string): Document;
}

export class DOMParser {
    constructor(private implementation: DOMParserProvider) { }

    parse(html: string): Document {
        return this.implementation.parse(html);
    }

    // From https://github.com/taoqf/node-html-parser/blob/a1892f15bcafcdd964e0de80518e7ff740f314f8/src/nodes/html.ts#L442
    static removeWhitespace(el: HTMLElement) {
        let o = 0;
        el.childNodes.forEach((node) => {
            if (node.nodeType === NodeType.TEXT_NODE) {
                if (DOMParser.isWhitespace(node)) {
                    node.remove();
                }
                node.textContent = (node as TextNode).trimmedRawText ?? node.textContent?.trim() ?? '';
            } else if (node.nodeType === NodeType.ELEMENT_NODE) {
                DOMParser.removeWhitespace(node as HTMLElement);
            }
        });
        return this;
    }

    // From https://github.com/taoqf/node-html-parser/blob/a1892f15bcafcdd964e0de80518e7ff740f314f8/src/nodes/text.ts#L72
    static isWhitespace(n: Node) {
        return /^(\s|&nbsp;)*$/.test(n.textContent ?? '');
    }

    static getAttributeNames(el: HTMLElement) {
        if ('getAttributeNames' in el) {
            return (el as any).getAttributeNames() as string[];
        }
        return Object.keys((el as any).attributes);
    }
}