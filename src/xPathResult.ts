import * as fs from "fs";
import { hashString } from "./utils.js";

const DEFAULT_SAVE_DIRECTORY = ".llmxpath/";

export default class XPathResult<N = Node> {
    constructor(
        public xpath: string,
        public userInput: string,
        public result: N,
        public chunkSize: number,
        public chunksConsumed: number,
        public model: string = "chatgpt-3.5-turbo",
        public cached: boolean = false
    ) {}

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

    save() {
        const directory = DEFAULT_SAVE_DIRECTORY;
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
        const filename = `${directory}${hashString(this.userInput)}.json`;
        fs.writeFileSync(filename, JSON.stringify(this.toJSON(), null, 2));
    }

    async saveAsync() {
        const directory = DEFAULT_SAVE_DIRECTORY;
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
        const filename = `${directory}${hashString(this.userInput)}.json`;
        return fs.promises.writeFile(filename, JSON.stringify(this.toJSON(), null, 2));
    }


    /**
     * Interal use only
     */
    static _load<N = Node>(userInput: string) {
        const directory = DEFAULT_SAVE_DIRECTORY;
        const filename = `${directory}${hashString(userInput)}.json`;
        const data = fs.readFileSync(filename, "utf8");
        const json = JSON.parse(data);
        return new XPathResult(json.xpath, userInput, null as N, json.chunkSize, json.chunksConsumed, json.model, true);
    }
}