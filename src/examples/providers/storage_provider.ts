import * as fs from 'fs';
import { Storage } from '../../dependencies/storage.js';

const DEFAULT_SAVE_DIRECTORY = ".llmxpath/";

const provider = {
    getItem: async (key: string) => {
        return fs.promises.readFile(`${DEFAULT_SAVE_DIRECTORY}${key}.json`, "utf8");
    },
    setItem: async (key: string, value: string) => {
        if (!fs.existsSync(DEFAULT_SAVE_DIRECTORY)) {
            await fs.promises.mkdir(DEFAULT_SAVE_DIRECTORY);
        }
        return fs.promises.writeFile(`${DEFAULT_SAVE_DIRECTORY}${key}.json`, value);
    }
};

export default new Storage(provider);