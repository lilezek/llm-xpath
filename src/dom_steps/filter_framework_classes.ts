/**
 * @todo We should improve the list of classes from other frameworks.
 */
import { HTMLElement } from 'node-html-parser';

function startsWithMaterial(class_: string) {
    return class_.startsWith('mat-') || class_.startsWith('mdc-') || class_.startsWith('material-');
}

export default function FilterFrameworkClasses(root: HTMLElement) {
    const classes = root.getAttribute('class')?.split(' ') || [];
    const nonFrameworkClasses = classes.filter((class_) => !startsWithMaterial(class_));
    if (nonFrameworkClasses.length === 0) {
        root.removeAttribute('class');
    } else {
        root.setAttribute('class', nonFrameworkClasses.join(' '));
    }
    for (const node of root.childNodes) {
        if (node instanceof HTMLElement) {
            FilterFrameworkClasses(node);
        }
    }
}