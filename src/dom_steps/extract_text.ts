/**
 * Extracts readable text from the HTML text nodes or attributes such as aria-label attributes.
 */

import { Node, isHtmlElement } from "../dependencies/dom.js";

const attributes = [
    'aria-label',
    'alt',
    'title',
    'placeholder',
    'value',
    'label',
    'name',
    'id',
];

export default function ExtractReadableText(...rootNodes: Node[]): string[] {
    const text = [];
    for (const node of rootNodes) {
        if (isHtmlElement(node)) {
            for (const attr of attributes) {
                if (node.hasAttribute(attr)) {
                    text.push(node.getAttribute(attr)!);
                }
            }
        } else {
            text.push((node as Node).rawText ?? node.textContent?.trim() ?? '');
        }

        for (const child of node.childNodes) {
            text.push(...ExtractReadableText(child));
        }
    }
    // Return a unique list of text
    return Array.from(new Set(text));
}
