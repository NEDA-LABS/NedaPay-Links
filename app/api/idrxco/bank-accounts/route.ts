import { NextRequest, NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";


export async function GET() {
const path = "/api/auth/get-bank-accounts";
const { headers } = idrxHeaders("GET", `${IDRX_BASE}${path}`, "");
const r = await fetch(`${IDRX_BASE}${path}`, { headers: { ...headers } });
const j = await r.json();
return NextResponse.json(j, { status: r.status });
}


export async function POST(req: NextRequest) {
const form = await req.formData();
const body = {
bankAccountNumber: String(form.get("bankAccountNumber")),
bankCode: String(form.get("bankCode")),
};
const path = "/api/auth/add-bank-account";
const { headers } = idrxHeaders("POST", `${IDRX_BASE}${path}`, body);
const r = await fetch(`${IDRX_BASE}${path}`, {
method: "POST",
headers: { ...headers, "Content-Type": "application/json" },
body: JSON.stringify(body),
});
const j = await r.json();
return NextResponse.json(j, { status: r.status });
}