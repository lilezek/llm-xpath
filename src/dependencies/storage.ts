interface StorageProvider {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
}

export class Storage {
    constructor(private implementation: StorageProvider) {}

    async getItem(key: string) {
        return await this.implementation.getItem(key);
    }

    async setItem(key: string, value: string) {
        return await this.implementation.setItem(key, value);
    }
}