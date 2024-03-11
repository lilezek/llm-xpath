import { DOMParser as XMLDomParser } from '@xmldom/xmldom';
import { XMLParser } from '../../dependencies/xml.js';

const noop = () => { };

const parser = new XMLDomParser({
    errorHandler: {
        warning: (msg) => noop,
        error: (msg) => noop,
        fatalError: (msg) => noop,
    },
});

const provider = {
    parse(html: string) {
        return parser.parseFromString(html);
    }
}

export default new XMLParser(provider);

