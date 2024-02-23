import { HTMLElement } from 'node-html-parser';


export default function* SubtreeStrategy(root: HTMLElement, sizeLimit: number): Iterable<string> {
    for (const node of root.childNodes) {
        if (node instanceof HTMLElement) {
            const text = node.toString();
            if (text.length <= sizeLimit) {
                yield text;
            }
            // If the node is too big, recursively split it
            else {
                yield* SubtreeStrategy(node, sizeLimit);
            }
        }
    }
}
