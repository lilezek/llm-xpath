import * as xpath from 'xpath';
import { XPath } from '../../dependencies/xpath.js';

const provider = {
    select(query: string, chunk: Node) {
        const result = xpath.select(query, chunk);

        if (result instanceof Array) {
            return result;
        } else if (typeof result === 'object' && result !== null) {
            return [result];
        } else {
            return [];
        }
    }
};

export default new XPath(provider);