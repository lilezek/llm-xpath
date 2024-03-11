/**
 * Extracts readable text from the HTML text nodes or attributes such as aria-label attributes.
 */

import { HTMLElement, Node, isHtmlElement } from "../dependencies/dom.js";

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

export default function ExtractReadableText(...rootNodes: HTMLElement[]): string[] {
    const text = [];
    for (const root of rootNodes) {
        for (const node of root.childNodes) {
            if (isHtmlElement(node)) {
                for (const attr of attributes) {
                    if (node.hasAttribute(attr)) {
                        text.push(node.getAttribute(attr)!);
                    }
                }
                text.push(...ExtractReadableText(node));
            } else {
                text.push((node as Node).rawText ?? node.textContent?.trim() ?? '');
            }
        }
    }
    // Return a unique list of text
    return Array.from(new Set(text));
}
