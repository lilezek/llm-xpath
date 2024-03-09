import { ChatGPTAPI, ChatGPTError } from 'chatgpt';
import dotenv from 'dotenv';
import systemMessageJson from './system_prompt_en.json' assert { type: "json" };
import systemMessageFindInListJson from './system_prompt_list_en.json' assert { type: "json" };
dotenv.config();

const systemMessage = systemMessageJson[0];
const systemMessageFindInList = systemMessageFindInListJson[0];

const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY!,
    completionParams: {
        temperature: 0,
        max_tokens: 4096,
        top_p: 0.5,
        model: "gpt-3.5-turbo",
        presence_penalty: 0,
    },
    maxModelTokens: 16_000
  });

const jsonResponseRE = /({.+})/gms;

async function LLMChat(system: string, prompt: string, retries: number) {
    let response;
    let attempts = 0;
    while (attempts < retries) {
        try {
            response = await api.sendMessage(prompt, {systemMessage: system});
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

export interface XPathLLMResponse {
    xpath: string | null;
    p: number;
}

function isXPathLLMResponse(json: any): json is XPathLLMResponse {
    if (!json || !('xpath' in json || 'p' in json)) {
        return typeof json.p === 'number';
    }
    return true;
}

export default async function LLMChatProcessChunk(chunk: string, userContext: string, retries = 3) {
    const prompt = `${userContext}\n\`\`\`${chunk}\`\`\``;
    const text = await LLMChat(systemMessage, prompt, retries);

    const m = text.match(jsonResponseRE);
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

    if (isXPathLLMResponse(object)) {
        return object;
    } else {
        throw new Error(`Invalid json: '${inner}'`);
    }
}

interface ListIndexLLMResponse {
    index: number;
}

function isListIndexLLMResponse(json: any): json is ListIndexLLMResponse {
    return json && typeof json['index'] === 'number';
}

export async function LLMChatFindInList(list: string[], userContext: string, retries = 3) {
    const listString = list.map((s, i) => `${i}. ${s}`).filter(s => /^\d+\.\s*$/.test(s) === false);
    const prompt = `${userContext}\n\n${listString.join('\n')}`;

    const text = await LLMChat(systemMessageFindInList, prompt, retries);

    const m = text.match(jsonResponseRE);

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

    if (isListIndexLLMResponse(object)) {
        return object.index;
    } else {
        throw new Error(`Invalid json: '${inner}'`);
    }
}