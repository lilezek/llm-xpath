import { ChatGPTAPI } from 'chatgpt';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const systemMessage = fs.readFileSync("LLM/system_prompt_en.txt", "utf-8");

const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY!,
    completionParams: {
        temperature: 0,
        max_tokens: 4000,
        top_p: 0.5,
    },
    systemMessage,
  });

const responseRE = /```(json)?(.+)```/gms; 

function isValidJson(json: any): json is {xpath: string | null, p: number} {
    if (!json || !('xpath' in json || 'p' in json)) {
        return typeof json.p === 'number';
    }
    return true;
}

export default async function LLMChatProcessChunk(chunk: string, userContext: string, probabilityCut = 0.66) {
    const prompt = `${userContext}\n\`\`\`${chunk}\`\`\``;
    const response = await api.sendMessage(prompt);
    const text = response.text;

    const m = text.match(responseRE);
    let inner = text;

    if (m) {
        // For some reason, the group doesn't work (the regex tests but doesn't capture)
        inner = m[0].slice(3, -3).trim();
    }
    
    let object = null;
    try {
        object = JSON.parse(inner);
    } catch (e) {
        throw new Error(`Not a json: '${inner}', reason: ${e}`);
    }

    if (isValidJson(object)) {
        return probabilityCut > object.p ? null : object.xpath;
    } else {
        throw new Error(`Invalid json: '${inner}'`);
    }
}