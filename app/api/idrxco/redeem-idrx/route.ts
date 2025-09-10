import { NextRequest, NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";


export async function POST(req: NextRequest) {
const form = await req.formData();
const body = {
amount: Number(form.get("amount")), // in IDR units
bankAccountHash: String(form.get("bankAccountHash")), // {bankName}_{bankAccountNumber}
burnTxHash: String(form.get("burnTxHash")),
};
const path = "/api/transaction/redeem-request";
const { headers } = idrxHeaders("POST", `${IDRX_BASE}${path}`, body);
const r = await fetch(`${IDRX_BASE}${path}`, {
method: "POST",
headers: { ...headers, "Content-Type": "application/json" },
body: JSON.stringify(body),
});
const j = await r.json();
return NextResponse.json(j, { status: r.status });
}