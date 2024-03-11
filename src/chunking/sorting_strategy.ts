import { HTMLElement } from '../dependencies/dom.js';
import * as stringSimilarity from 'string-similarity';
import ExtractReadableText from '../dom_steps/extract_text.js';

export default function SortingStrategy(
    chunks: Iterable<HTMLElement[]>,
    elementToFind: string,
    nodeToText: (...node: HTMLElement[]) => string[] = ExtractReadableText) {
    // Sort desc by similarity to the user input
    const chunksWithSimilarity = Array.from(chunks).map(chunk => {
        const text = nodeToText(...chunk).join(' ');

        if (text.includes(elementToFind)) {
            return {
                chunk,
                similarity: 1
            };
        }

        return {
            chunk,
            similarity: stringSimilarity.compareTwoStrings(text, elementToFind)
        };
    }).sort((a, b) => b.similarity - a.similarity);

    return chunksWithSimilarity.map(c => c.chunk);
}