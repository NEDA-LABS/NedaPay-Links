// /app/api/analytics/influencer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/utils/privyUserIdFromRequest";

const prisma = new PrismaClient();

// Helper: convert string amounts to number safely
const toNum = (s: string | null | undefined) => {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export async function GET(req: NextRequest) {
  try {
    const privyUserId = await getUserIdFromRequest(req);
    if (!privyUserId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const platformUser = await prisma.user.findUnique({
      where: { privyUserId },
    });

    // Find influencer profile for this user
    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId: platformUser?.id },
      select: { id: true, customCode: true, displayName: true, isActive: true },
    });

    if (!influencer) {
      return NextResponse.json({
        influencer: null,
        referralsCount: 0,
        referredUsers: [],
        transactions: [],
        totals: {
          txCount: 0,
          txVolumeByCurrency: [] as { currency: string; total: number }[],
        },
      });
    }

    // Count referrals by influencerCode (source of truth)
    const referrals = await prisma.referral.findMany({
      where: { influencerCode: influencer.customCode },
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, wallet: true, email: true } },
      },
    });

    const referredWallets = referrals
      .map((r) => r.user?.wallet)
      .filter((w): w is string => Boolean(w));

    // Sum transactions whose wallet belongs to any referred user
    const transactions = await prisma.transaction.findMany({
      where: { wallet: { in: referredWallets } },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        currency: true,
        status: true,
      },
    });

    // Aggregate by currency
    const volumeMap = new Map<string, number>();
    for (const t of transactions) {
      const curr = t.currency || "UNK";
      volumeMap.set(curr, (volumeMap.get(curr) ?? 0) + (t.amount ?? 0));
    }

    const txVolumeByCurrency = Array.from(volumeMap.entries()).map(
      ([currency, total]) => ({ currency, total })
    );

    // Status breakdown
    const statusMap = new Map<string, number>();
    for (const t of transactions) {
      const s = t.status || "UNKNOWN";
      statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }

    return NextResponse.json({
      influencer,
      referralsCount: referrals.length,
      referredUsers: referrals.map((r) => ({
        id: r.id,
        userId: r.user?.id,
        wallet: r.user?.wallet,
        createdAt: r.createdAt,
      })),
      transactions,
      totals: {
        txCount: transactions.length,
        txVolumeByCurrency,
        statusBreakdown: Array.from(statusMap.entries()).map(
          ([name, value]) => ({ name, value })
        ),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
