import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
  try {
    const rows = await prisma.idrxOnboarded.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const data = rows.map((r: any) => ({
      userId: r.userId,
      email: r.user?.email ?? null,
      name: r.user?.name ?? null,
      provider: r.provider,
      idrxId: r.idrxId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({ statusCode: 200, data });
  } catch (err: any) {
    console.error("GET /api/idrxco/onboarding/status error:", err);
    return NextResponse.json({ statusCode: 500, message: "Internal Server Error" }, { status: 500 });
  }
}
