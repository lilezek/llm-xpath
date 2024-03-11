import { HTMLElement, isHtmlElement } from "../dependencies/dom.js";

export default function* SubtreeStrategy(root: HTMLElement, sizeLimit: number): Iterable<HTMLElement> {
    for (const node of root.childNodes) {
        if (isHtmlElement(node)) {
            const text = node.toString();
            if (text.length <= sizeLimit) {
                yield node;
            }
            // If the node is too big, recursively split it
            else {
                yield* SubtreeStrategy(node, sizeLimit);
            }
        }
    }
}
