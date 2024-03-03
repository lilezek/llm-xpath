import { ChatGPTAPI, ChatGPTError } from 'chatgpt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const systemMessage = fs.readFileSync(path.join(__dirname, "../../", "LLM/system_prompt_en.txt"), "utf-8");

const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY!,
    completionParams: {
        temperature: 0,
        max_tokens: 4000,
        top_p: 0.5,
        model: "gpt-3.5-turbo-1106"
    },
    systemMessage,
  });

const responseRE = /({.+})/gms; 

export interface LLMResponse {
    xpath: string | null;
    p: number;
}

function isValidJson(json: any): json is LLMResponse {
    if (!json || !('xpath' in json || 'p' in json)) {
        return typeof json.p === 'number';
    }
    return true;
}

export default async function LLMChatProcessChunk(chunk: string, userContext: string, retries = 3) {
    const prompt = `${userContext}\n\`\`\`${chunk}\`\`\``;
    let response;
    let attempts = 0;
    while (attempts < retries) {
        try {
            response = await api.sendMessage(prompt);
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

    const text = response.text;

    const m = text.match(responseRE);
    let inner = text;

    if (m) {
        inner = m[0].trim();
    }
    
    let object = null;
    try {
        object = JSON.parse(inner);
    } catch (e) {
        throw new Error(`Not a json: '${inner}', reason: ${e}`);
    }

    if (isValidJson(object)) {
        return object;
    } else {
        throw new Error(`Invalid json: '${inner}'`);
    }
}