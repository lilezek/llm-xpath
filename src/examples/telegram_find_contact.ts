import { readFileSync } from "fs";
import { LLMSelector } from "../main.js";
import dotenv from 'dotenv';
dotenv.config();

const llmSelector = new LLMSelector({
    openaiApiKey: process.env.OPENAI_API_KEY!,
});


/**
 * Usage example
 */
async function main() {
    const example = readFileSync('telegram_example.html', 'utf8');
    for await (const res of llmSelector.findXPath(example, "Telegram chat page", "The contact Alfredo", "Alfredo")) {
        console.log(JSON.stringify(res));
        res.save();
        return;
    }
}

main().then(() => console.log('done')).catch(console.error);