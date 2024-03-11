import { DOMParser, HTMLElement, isHtmlElement } from "../dependencies/dom.js";

export default function FilterEmptyNodes(root: HTMLElement): boolean {
    const hasText = root.textContent && root.textContent.trim();
    const hasAttributes = DOMParser.getAttributeNames(root).length > 0;
    let hasChildren = false;
    for (const node of root.childNodes) {
        if (isHtmlElement(node)) {
            hasChildren = FilterEmptyNodes(node) || hasChildren;
        }
    }
    if (!hasChildren && !hasText && !hasAttributes) {
        root.remove();
        return false;
    }
    return true;
}