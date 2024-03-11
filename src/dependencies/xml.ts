export interface XMLParserProvider {
    parse(html: string): Document;
}


export class XMLParser {
    private implementation: XMLParserProvider;

    constructor(provider: XMLParserProvider) {
        this.implementation = provider;
    }

    parse(html: string) {
        return this.implementation.parse(html);
    }
}