import systemMessageJson from './system_prompt_en_deepseek_r1.json' assert { type: "json" };
import systemMessageFindInListJson from './system_prompt_list_en.json' assert { type: "json" };
import { Chat } from './chat.js';
import ollama from 'ollama';

const systemMessage = systemMessageJson[0];
const systemMessageFindInList = systemMessageFindInListJson[0];


// We need to drop <think>...</think> content from the response
const thinkRegex = /<think>.*?<\/think>/gs;

export class OllamaChat extends Chat {
    constructor(private model: string) {
        super(systemMessage, systemMessageFindInList);
    }

    protected async llmChat(system: string, prompt: string, retries: number): Promise<string> {
        let attempts = 0;

        while (attempts < retries) {
            try {
                const response = await ollama.chat({
                    model: this.model,
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: prompt }
                    ],
                    options: {
                        num_ctx: 16_000,
                    }
                });
                const text = response.message.content;
                return text.replace(thinkRegex, '');
            } catch (e) {
                attempts++;
                console.error(`Error in attempt ${attempts}: ${(e as Error).message}`);
            }
        }
        throw new Error(`Failed to get a response from the API after ${retries} attempts`);
    }
}