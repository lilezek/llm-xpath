# WIP: Uses an LLM to find a selector (XPATH) in a HTML/XML tree.

This is a WIP: it is not published to npm or bundled as a package.

Example usage:

```ts
async function main() {
    const example = fs.readFileSync('telegram_example.html', 'utf8');
    for await (const res of llmSelector.findXPath(example, "Telegram chat page", "input field for message")) {
        console.log(JSON.stringify(res));
        res.save();
        return;
    }
}
```