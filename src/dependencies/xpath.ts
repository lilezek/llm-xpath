export interface XPathProvider {
    select(query: string, document: Document): Node[];
}

export interface XPathResult {
    
}

export class XPath {
    constructor(private implementation: XPathProvider) {}

    select(query: string, document: Document) {
        return this.implementation.select(query, document);
    }
}