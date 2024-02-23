import { HTMLElement } from 'node-html-parser';

const attributesToIgnore = new Set([
    'class',
]);

export default function FilterEmptyNodes(root: HTMLElement): boolean {
    const hasText = root.textContent && root.textContent.trim();
    const hasAttributes = Object.keys(root.attributes).filter((attr) => !attributesToIgnore.has(attr)).length > 0;
    let hasChildren = false;
    for (const node of root.childNodes) {
        if (node instanceof HTMLElement) {
            hasChildren = FilterEmptyNodes(node) || hasChildren;
        }
    }
    if (!hasChildren && !hasText && !hasAttributes) {
        root.remove();
        return false;
    }
    return true;
}