import { Storage } from "./dependencies/storage.js";
import { hashString } from "./utils.js";


export default class XPathResult<N = Node> {
    constructor(
        private storage: Storage,
        public xpath: string,
        public userInput: string,
        public result: N,
        public chunkSize: number,
        public chunksConsumed: number,
        public model: string = "chatgpt-3.5-turbo",
        public cached: boolean = false
    ) { }

    toString(): string {
        return this.xpath;
    }

    toJSON() {
        return {
            xpath: this.xpath,
            chunkSize: this.chunkSize,
            chunksConsumed: this.chunksConsumed,
            model: this.model,
        };
    }

    async save() {
        const key = `${await hashString(this.userInput)}.json`;
        return this.storage.setItem(key, JSON.stringify(this.toJSON()));
    }


    /**
     * Interal use only
     */
    static async _load<N = Node>(storage: Storage, userInput: string) {
        const key = `${await hashString(userInput)}.json`;
        let json: any;
        try {
            const data = (await storage.getItem(key))!;
            json = JSON.parse(data);
            if (!json) {
                return null;
            }
        } catch (e) {
            return null;
        }
        return new XPathResult(storage, json.xpath, userInput, null as N, json.chunkSize, json.chunksConsumed, json.model, true);
    }
}