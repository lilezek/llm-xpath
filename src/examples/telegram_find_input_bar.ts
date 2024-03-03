import { readFileSync } from "fs";
import { llmSelector } from "../main.js";

/**
 * Usage example
 */
async function main() {
    const example = readFileSync('telegram_chat_example.html', 'utf8');
    for await (const res of llmSelector(example, "Telegram", "Write message input bar")) {
        console.log(JSON.stringify(res));
        res.save();
        return;
    }
}

main().then(() => console.log('done')).catch(console.error);