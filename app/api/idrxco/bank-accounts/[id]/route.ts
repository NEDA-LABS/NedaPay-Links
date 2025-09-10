// ===============================================================
// DELETE bank account
// ===============================================================
import { NextRequest, NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../../_core";


export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
const path = `/api/auth/delete-bank-account/${params.id}`;
const { headers } = idrxHeaders("GET", `${IDRX_BASE}${path}`, ""); // docs example signs as GET
const r = await fetch(`${IDRX_BASE}${path}`, { method: "DELETE", headers: { ...headers } });
const j = await r.json();
return NextResponse.json(j, { status: r.status });
}