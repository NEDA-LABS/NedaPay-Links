import { createSignature, nowMillis } from "@/utils/idrxco/signature";


export function idrxHeaders(method: string, url: string, body?: any) {
const timestamp = nowMillis();
const sig = createSignature(method, url, body ?? "", timestamp, process.env.IDRX_API_SECRET!);
return {
timestamp,
headers: {
"idrx-api-key": process.env.IDRX_API_KEY!,
"idrx-api-sig": sig,
"idrx-api-ts": timestamp,
},
};
}


export const IDRX_BASE = "https://idrx.co";