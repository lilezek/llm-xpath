import { HTMLElement } from 'node-html-parser';

/**
 * Attributes to remove from the elements that are not needed for the text extraction.
 */
const attributesToFilter = new Set([
    'style',
    'aria-labelledby',
    'aria-describedby',
    'aria-hidden',
    'aria-haspopup',
    'aria-expanded',
    'aria-controls',
    'tabindex',
    // 'contenteditable', this is needed for some cases to understand this is an editable field like an input
    'hidden',
    'role',
    'href',
    'target',
    'rel',
    'dir',
    'type',
    'autocomplete',
]);

export default function FilterAttributes(root: HTMLElement) {
    for (const attr in root.attrs) {
        const attrLower = attr.toLowerCase();
        if (attributesToFilter.has(attrLower)) {
            root.removeAttribute(attrLower);
        }
    }
    // Drop title if aria-label is present
    if (root.getAttribute('aria-label')) {
        root.removeAttribute('title');
    }

    for (const node of root.childNodes) {
        if (node instanceof HTMLElement) {
            FilterAttributes(node);
        }
    }
}