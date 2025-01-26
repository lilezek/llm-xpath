import { ChatGPTAPI, ChatGPTError } from 'chatgpt';
import systemMessageJson from './system_prompt_en.json' assert { type: "json" };
import systemMessageFindInListJson from './system_prompt_list_en.json' assert { type: "json" };
import { Chat } from './chat.js';

const systemMessage = systemMessageJson[0];
const systemMessageFindInList = systemMessageFindInListJson[0];

export class ChatGPTChat extends Chat {
    private implementation: ChatGPTAPI;

    constructor(apiKey: string) {
        super(systemMessage, systemMessageFindInList);
        let fetch = globalThis.fetch;
        if (typeof window !== "undefined") {
            fetch = window.fetch.bind(window);
        }

        this.implementation = new ChatGPTAPI({
            apiKey,
            completionParams: {
                temperature: 0,
                max_tokens: 4096,
                top_p: 0.5,
                model: "gpt-3.5-turbo",
                presence_penalty: 0,
            },
            maxModelTokens: 16_000,
            fetch,
        });
    }

    protected async llmChat(system: string, prompt: string, retries: number) {
        let response;
        let attempts = 0;
        while (attempts < retries) {
            try {
                response = await this.implementation.sendMessage(prompt, { systemMessage: system });
                break;
            } catch (e) {
                if (e instanceof ChatGPTError && (e.statusCode ?? 200) >= 500) {
                    attempts++;
                    console.error(`Error in attempt ${attempts}: ${e.message}`);
                } else {
                    throw e;
                }
            }
        }

        if (!response) {
            throw new Error(`Failed to get a response from the API after ${retries} attempts`);
        }

        return response.text;
    }
}
