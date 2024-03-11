# Uses an LLM to find a selector (XPATH) in a HTML/XML tree.

## Constructing this library

This library expects you to provide an XML parser, a XPath library, and a DOM (HTML) parser.

See src/examples/providers on how to construct the selector

```ts
const llmSelector = new LLMSelector({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    domParser: DOMParser,
    xmlParser: XMLParser,
    xpath: XPath,
});
```

## Example usage

This is a WIP: it is not published to npm or bundled as a package.

Example usage:

```ts
async function main() {
    const example = fs.readFileSync('telegram_example.html', 'utf8');
    for await (const res of llmSelector.findXPath(example, "Telegram chat page", "input field for message")) {
        console.log(JSON.stringify(res));
        await res.save();
        return;
    }
}
```