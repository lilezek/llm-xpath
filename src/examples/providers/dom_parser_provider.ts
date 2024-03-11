import { parse } from 'node-html-parser';
import { DOMParser } from '../../dependencies/dom.js';

const provider = {
    parse(html: string) {
        return parse(html);
    }
}

export default new DOMParser(provider as any);
