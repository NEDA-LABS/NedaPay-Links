import { NextRequest, NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";


export async function POST(req: NextRequest) {
const form = await req.formData();


// Build a mirror object (without the file) just for signature computation,
// mirroring the example in docs that JSON.stringify(form) was used.
const sigBody = {
email: form.get("email"),
fullname: form.get("fullname"),
address: form.get("address"),
idNumber: form.get("idNumber"),
idFile: true, // sentinel to keep field list stable for HMAC
};


const path = "/api/auth/onboarding";
const { headers } = idrxHeaders("POST", `${IDRX_BASE}${path}`, sigBody);


const upstream = await fetch(`${IDRX_BASE}${path}`, {
method: "POST",
headers: {
...headers,
// DON'T set content-type manually; let fetch set the multipart boundary
} as any,
body: form,
});


const json = await upstream.json();
return NextResponse.json(json, { status: upstream.status });
}