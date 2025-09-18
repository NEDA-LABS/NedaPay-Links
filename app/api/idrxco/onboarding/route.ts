import { NextRequest, NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";
import { PrismaClient } from "@prisma/client";
import { encryptToBase64 } from "@/utils/crypto";


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const email = (form.get("email") || "").toString().trim().toLowerCase();
    const fullname = (form.get("fullname") || "").toString();
    const address = (form.get("address") || "").toString();
    const idNumber = (form.get("idNumber") || "").toString();

    if (!email) {
      return NextResponse.json({
        statusCode: 400,
        message: "Missing email in form data",
      }, { status: 400 });
    }

    // Ensure user exists by email (as requested). We cannot create a user here because privyUserId is required.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({
        statusCode: 404,
        message: "User not found for provided email",
      }, { status: 404 });
    }

    // Build signature body (excluding file) for the upstream call
    const sigBody = {
      email,
      fullname,
      address,
      idNumber,
      idFile: true,
    };

    // Forward to IDRX upstream
    const path = "/api/auth/onboarding";
    const { headers } = idrxHeaders("POST", `${IDRX_BASE}${path}`, sigBody);
    const upstream = await fetch(`${IDRX_BASE}${path}`, {
      method: "POST",
      headers: {
        ...headers,
        // do not set content-type for multipart
      } as any,
      body: form,
    });

    const json = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const msg = json?.message || "Upstream onboarding failed";
      return NextResponse.json({ statusCode: upstream.status, message: msg, error: json }, { status: upstream.status });
    }

    // Expect the documented success shape
    const data = json?.data as undefined | {
      id: number;
      fullname: string;
      createdAt: string;
      apiKey: string;
      apiSecret: string;
    };

    if (!data?.id || !data.apiKey || !data.apiSecret) {
      return NextResponse.json({ statusCode: 502, message: "Unexpected response shape from IDRX" }, { status: 502 });
    }

    // Update user's name with fullname
    if (fullname && fullname !== user.name) {
      await prisma.user.update({ where: { id: user.id }, data: { name: fullname } });
    }

    // Encrypt credentials and upsert IdraxOnboarded record
    const apiKeyEnc = encryptToBase64(data.apiKey);
    const apiSecretEnc = encryptToBase64(data.apiSecret);

    await prisma.idrxOnboarded.upsert({
      where: { userId: user.id },
      update: {
        idrxId: data.id,
        apiKeyEnc,
        apiSecretEnc,
      },
      create: {
        userId: user.id,
        idrxId: data.id,
        apiKeyEnc,
        apiSecretEnc,
      },
    });

    // Return a safe response that doesn't leak secrets
    return NextResponse.json({
      statusCode: 201,
      message: json?.message || "success",
      data: {
        id: data.id,
        fullname: data.fullname,
        createdAt: data.createdAt,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("IDRX onboarding error:", err);
    return NextResponse.json({ statusCode: 500, message: "Internal Server Error" }, { status: 500 });
  }
}
