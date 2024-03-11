import { HTMLElement, isHtmlElement } from "../dependencies/dom.js";

/**
 * Nodes to remove from the HTML tree that are not needed for the text extraction.
 */
const nodesToFilter = new Set([
    'style',
    'script',
    'link',
    'meta',
    'noscript',
    'iframe',
    'svg',
    'img',
    'picture',
    'audio',
    'video',
    'source',
    'track',
    'embed',
    'object',
    'param',
    'canvas',
    'map',
    'area',
]);

export default function FilterNodes(root: HTMLElement) {
    const tagName = root.tagName ?? '';
    if (nodesToFilter.has(tagName.toLowerCase())) {
        root.remove();
        return;
    }
    for (const node of root.childNodes) {
        if (isHtmlElement(node)) {
            FilterNodes(node);
        }
    }
}