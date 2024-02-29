import { HTMLElement } from 'node-html-parser';

export default function TrimText(root: HTMLElement) {
    root.removeWhitespace();
    for (const node of root.childNodes) {
        if (node instanceof HTMLElement) {
            TrimText(node);
        }
    }
}