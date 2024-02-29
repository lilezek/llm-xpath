import { HTMLElement } from 'node-html-parser';
import dictionary from '../english_dict.js';

function isEnglish(class_: string) {
    const parts = class_.toLowerCase().split('-');
    for (const part of parts) {
        if (!dictionary.has(part)) {
            return false;
        }
    }
    return true;
}

export default function FilterNonEnglishClasses(root: HTMLElement) {
    const classes = root.getAttribute('class')?.split(' ') || [];
    const englishClasses = classes.filter(isEnglish);
    if (englishClasses.length === 0) {
        root.removeAttribute('class');
    } else {
        root.setAttribute('class', englishClasses.join(' '));
    }
    for (const node of root.childNodes) {
        if (node instanceof HTMLElement) {
            FilterNonEnglishClasses(node);
        }
    }
}