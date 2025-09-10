// HMAC-SHA256 (base64url) signer
// Based on IDRX "Generating a Signature" docs.
// ===============================================================
import * as crypto from "crypto";


function atobNode(str: string) {
return Buffer.from(str, "base64").toString("binary");
}


export function createSignature(
method: string,
url: string,
body: Buffer | string | object | null,
timestamp: string,
secretKeyBase64: string
) {
const secret = atobNode(secretKeyBase64);
const hmac = crypto.createHmac("sha256", secret);


const normalizedBody =
body == null
? Buffer.from("")
: Buffer.isBuffer(body)
? body
: typeof body === "string"
? Buffer.from(body)
: Buffer.from(JSON.stringify(body));


// The IDRX guide concatenates timestamp, method, url, then body
// in that order when updating the HMAC.
hmac.update(timestamp);
hmac.update(method);
hmac.update(url);
if (normalizedBody.length) {
hmac.update(normalizedBody);
}
return hmac.digest().toString("base64url");
}


export function nowMillis(): string {
return Math.round(Date.now()).toString();
}