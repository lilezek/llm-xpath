let nodeCrypto = import("crypto");
let webCrypto = typeof window !== "undefined" && window.crypto;

export async function hashString(input: string) {
    if (webCrypto) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        return webCrypto.subtle.digest("SHA-256", data).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
            return hashHex;
        });
    }

    return (await nodeCrypto).createHash("sha256").update(input).digest("hex");
}
