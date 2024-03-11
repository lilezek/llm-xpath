import { HTMLElement, isHtmlElement } from "../dependencies/dom.js";

/**
 * Attributes to keep from the elements that may be useful for the text extraction.
 */
const attributesToFilter = new Set([
    'aria-label',
    'contenteditable', // this is needed for some cases to understand this is an editable field like an input
    'title',
    // 'class',
    'id'
]);

export default function FilterAttributes(root: HTMLElement) {
    for (const attr in root.attributes) {
        const attrLower = attr.toLowerCase();
        if (!attributesToFilter.has(attrLower)) {
            root.removeAttribute(attrLower);
        }
    }
    // Drop title if aria-label is present
    if (root.getAttribute('aria-label')) {
        root.removeAttribute('title');
    }

    for (const node of root.childNodes) {
        if (isHtmlElement(node)) {
            FilterAttributes(node);
        }
    }
}