import { NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";

export async function GET() {
  try {
    const path = "/api/transaction/method";
    const url = `${IDRX_BASE}${path}`;
    const { headers } = idrxHeaders("GET", url, "");
    const r = await fetch(url, { headers: { ...headers } });
    const j = await r.json();
    return NextResponse.json(j, { status: r.status });
  } catch (err: any) {
    const message = err?.message ?? "Failed to fetch IDRX methods";
    return NextResponse.json({ statusCode: 500, message }, { status: 500 });
  }
}
