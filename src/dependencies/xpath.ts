export interface XPathProvider {
    select(query: string, chunk: Node): Node[];
}

export interface XPathResult {
    
}

export class XPath {
    constructor(private implementation: XPathProvider) {}

    select(query: string, node: Node) {
        return this.implementation.select(query, node);
    }
}