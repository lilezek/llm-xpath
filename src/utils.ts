import * as crypto from "crypto";

export function hashString(input: string) {
    return crypto.createHash("sha256").update(input).digest("hex");
}
