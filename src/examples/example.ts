import { readFileSync } from "fs";
import { llmSelector } from "../main.js";

/**
 * Usage example
 */
async function main() {
    const example = readFileSync('telegram_example.html', 'utf8');
    for await (const res of llmSelector(example, "Telegram chat page", "input field for message")) {
        console.log(JSON.stringify(res));
        res.save();
        return;
    }
}

main().then(() => console.log('done')).catch(console.error);