/**
 * Extracts readable text from the HTML text nodes or attributes such as aria-label attributes.
 */

import { HTMLElement } from 'node-html-parser';

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

export default function ExtractReadableText(...rootNodes: HTMLElement[]): string {
    const text = [];
    for (const root of rootNodes) {
        for (const node of root.childNodes) {
            if (node instanceof HTMLElement) {
                for (const attr of attributes) {
                    if (node.attributes[attr]) {
                        text.push(node.attributes[attr]);
                    }
                }
                text.push(ExtractReadableText(node));
            } else {
                text.push(node.rawText);
            }
        }
    }
    return text.join(' ');
}
