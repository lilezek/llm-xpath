export default function* GroupingStrategy(chunks: Iterable<string>, sizeLimit: number): Iterable<string> {
    let currentChunk = '';
    for (const chunk of chunks) {
        if (currentChunk.length + chunk.length > sizeLimit) {
            yield currentChunk;
            currentChunk = '';
        }
        currentChunk += chunk;
    }
    yield currentChunk;
}