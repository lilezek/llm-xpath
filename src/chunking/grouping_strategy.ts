import { DOMParser, HTMLElement } from "../dependencies/dom.js";

export default function* GroupingStrategy(nodes: Iterable<HTMLElement>, sizeLimit: number): Iterable<HTMLElement[]> {
    let currentChunk: HTMLElement[] = [];
    let totalSize = 0;
    for (const node of nodes) {
        const nodeSize = node.outerHTML.length;
        if (totalSize + nodeSize <= sizeLimit) {
            currentChunk.push(node);
            totalSize += nodeSize;
        } else {
            yield currentChunk;
            currentChunk = [node];
            totalSize = nodeSize;
        }
    }
    yield currentChunk;
}