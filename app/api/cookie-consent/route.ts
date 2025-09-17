import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/utils/privyUserIdFromRequest";

const prisma = new PrismaClient();

// export const runtime = "nodejs";

const CONSENT_COOKIE = "nedapay.cookieConsent.v1";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserIdFromRequest(req);
    if (!user) {
      return NextResponse.json({ preferences: null });
    }
    const record = await prisma.cookieConsent.findUnique({
      where: { privyUserId: user },
    });
    if (!record) {
      return NextResponse.json({ preferences: null });
    }
    return NextResponse.json({ preferences: record.preferences });
  } catch (err) {
    console.error("cookie-consent check error", err);
    return NextResponse.json({ preferences: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { preferences, region } = body as {
      preferences: {
        necessary: boolean;
        analytics: boolean;
      };
      region?: string | null;
    };

    if (!preferences || typeof preferences.necessary !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Persist cookie for 6 months (typical). Adjust to your policy.
    const sixMonths = 60 * 60 * 24 * 30 * 6;

    // Set public cookie for SSR gating and client checks
    (
      await // Set public cookie for SSR gating and client checks
      cookies()
    ).set({
      name: CONSENT_COOKIE,
      value: JSON.stringify({ ...preferences, v: "v1" }),
      httpOnly: false, // readable by client to conditionally load scripts
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: sixMonths,
    });

    // If user is logged in, upsert a DB record (optional, but nice)
    const user = await getUserIdFromRequest(req); // { id, privyUserId } or null
    if (user) {
      await prisma.cookieConsent.upsert({
        where: { privyUserId: user },
        update: {
          preferences,
          region: region ?? undefined,
        },
        create: {
          privyUserId: user,
          preferences,
          region: region ?? undefined,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("cookie-consent POST error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
