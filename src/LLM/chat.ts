const jsonResponseRE = /({.+})/gms;

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

interface ListIndexLLMResponse {
    index: number;
}

function isListIndexLLMResponse(json: any): json is ListIndexLLMResponse {
    return json && typeof json['index'] === 'number';
}

export abstract class Chat {
    constructor(private systemMessage: string, private systemMessageFindInList: string) { }

    protected abstract llmChat(system: string, prompt: string, retries: number): Promise<string>;

    async processChunk(chunk: string, userContext: string, retries = 3) {
        console.log('Processing chunk');
        console.log(chunk);

        const prompt = `${userContext}\n\`\`\`${chunk}\`\`\``;
        const text = await this.llmChat(this.systemMessage, prompt, retries);
        console.log('Response:');
        console.log(text);

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

    async findInList(list: string[], userContext: string, retries = 3) {
        const listString = list.map((s, i) => `${i}. ${s}`).filter(s => /^\d+\.\s*$/.test(s) === false);
        const prompt = `${userContext}\n\n${listString.join('\n')}`;

        console.log('Finding in list');
        console.log(prompt);
        const text = await this.llmChat(this.systemMessageFindInList, prompt, retries);

        console.log('Response:');
        console.log(text);

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
}