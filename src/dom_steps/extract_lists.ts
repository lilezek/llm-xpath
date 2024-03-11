import { HTMLElement } from "../dependencies/dom.js";

enum CompatibleElements {
    NOT_COMPATIBLE = 0,
    COMPATIBLE = 1,
    // If both elements have no classes, check their children
    MAYBE_COMPATIBLE = 2,
}

/**
 * Two elements are compatible if they have the same tag and more than half of the classes.
 * @param one 
 * @param other 
 */
function AreCompatible(one: HTMLElement, other: HTMLElement) {
    if (one.tagName !== other.tagName) {
        return CompatibleElements.NOT_COMPATIBLE;
    }

    if (one.classList.length === 0 && other.classList.length === 0) {
        return CompatibleElements.MAYBE_COMPATIBLE;
    }

    const oneClasses = new Set(one.classList.values());
    const otherClasses = new Set(other.classList.values());
    const intersection = new Set([...oneClasses].filter(x => otherClasses.has(x)));

    if (intersection.size > oneClasses.size / 2) {
        return CompatibleElements.COMPATIBLE;
    }
}

/**
 * Returns true if all the children of the element are compatible with the previous element
 * @param root 
 */
export default function ExtractLists(root: HTMLElement) {
    let previousElement = root.childNodes[0] as HTMLElement;

}