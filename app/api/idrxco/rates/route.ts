import { NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";


export async function GET() {
const path = "/api/transaction/rates";
const { headers } = idrxHeaders("GET", `${IDRX_BASE}${path}`, "");
const r = await fetch(`${IDRX_BASE}${path}`, { headers: { ...headers } });
const j = await r.json();
return NextResponse.json(j, { status: r.status });
}