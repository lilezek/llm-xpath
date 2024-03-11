import { DOMParser, HTMLElement, isHtmlElement } from "../dependencies/dom.js";


export default function TrimText(root: HTMLElement) {
    DOMParser.removeWhitespace(root);
    for (const node of root.childNodes) {
        if (isHtmlElement(node)) {
            TrimText(node);
        }
    }
}