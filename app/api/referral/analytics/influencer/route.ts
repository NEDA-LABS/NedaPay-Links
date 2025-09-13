// /app/api/referral/analytics/influencer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/utils/privyUserIdFromRequest";

const prisma = new PrismaClient();

// safe number from optional string
const toNum = (s: string | null | undefined) => {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export async function GET(req: NextRequest) {
  try {
    const privyUserId = await getUserIdFromRequest(req);
    if (!privyUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const platformUser = await prisma.user.findUnique({
      where: { privyUserId },
      select: { id: true },
    });

    // Influencer profile for current user
    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId: platformUser?.id },
      select: { id: true, customCode: true, displayName: true, isActive: true },
    });

    if (!influencer) {
      return NextResponse.json({
        influencer: null,
        referralsCount: 0,
        referredUsers: [],
        earningsByCurrency: [] as { currency: string; total: number }[],
        totals: {
          txCount: 0,
          txVolumeByCurrency: [] as { currency: string; total: number }[],
          statusBreakdown: [] as { name: string; value: number }[],
        },
      });
    }

    // All referrals for this influencer (source of truth via code)
    const referrals = await prisma.referral.findMany({
      where: { influencerCode: influencer.customCode },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, wallet: true, email: true } },
      },
    });

    const referred = referrals
      .map((r) => ({
        referralId: r.id,
        referredAt: r.createdAt,
        wallet: r.user?.wallet ?? null,
        email: r.user?.email ?? null,
      }))
      .filter((x) => x.wallet) as { referralId: string; referredAt: Date; wallet: string; email: string | null }[];

    const wallets = referred.map((r) => r.wallet);

    // All OFF-RAMP transactions belonging to referred users (by wallet)
    const txs = wallets.length
      ? await prisma.offRampTransaction.findMany({
          where: { merchantId: { in: wallets } }, // merchantId == user.wallet
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            merchantId: true,
            amount: true,   // string
            rate: true,     // string
            currency: true, // string
            status: true,   // string
            createdAt: true,
          },
        })
      : [];

    // Build aggregates
    // Volume by currency (all off-ramps, regardless of status)
    const volByCcy: Record<string, number> = {};
    // Status breakdown
    const statusCount: Record<string, number> = {};

    for (const t of txs) {
      const c = t.currency || "UNK";
      volByCcy[c] = (volByCcy[c] ?? 0) + toNum(t.amount) * toNum(t.rate);

      const s = (t.status || "UNKNOWN");
      statusCount[s] = (statusCount[s] ?? 0) + 1;
    }

    // For each referral wallet, find FIRST settled off-ramp
    const byWallet = new Map<string, typeof txs>();
    for (const t of txs) {
      const w = t.merchantId;
      const arr = byWallet.get(w) ?? [];
      arr.push(t);
      byWallet.set(w, arr);
    }

    const perReferral = referred.map((r) => {
      const list = byWallet.get(r.wallet) ?? [];
      const firstSettled = list.find(
        (t) => (t.status || "").toLowerCase() === "settled"
      );
      const earning = firstSettled ? 0.1 * toNum(firstSettled.amount) * toNum(firstSettled.rate) : 0;
      const earningCurrency = firstSettled?.currency ?? null;

      return {
        referralId: r.referralId,
        email: r.email,
        wallet: r.wallet,
        referredAt: r.referredAt,
        firstSettledTx: firstSettled
          ? {
              id: firstSettled.id,
              amount: toNum(firstSettled.amount) * toNum(firstSettled.rate),
              currency: firstSettled.currency,
              createdAt: firstSettled.createdAt,
              status: firstSettled.status,
            }
          : null,
        earning: firstSettled
          ? { amount: Number(earning.toFixed(8)), currency: earningCurrency }
          : null,
        txCount: list.length,
      };
    });

    // Sum earnings by currency
    const earningsByCurrency: Record<string, number> = {};
    for (const row of perReferral) {
      if (row.earning?.currency) {
        earningsByCurrency[row.earning.currency] =
          (earningsByCurrency[row.earning.currency] ?? 0) + (row.earning.amount ?? 0);
      }
    }

    return NextResponse.json({
      influencer,
      referralsCount: referrals.length,
      referredUsers: perReferral
        .map((r) => ({
          referralId: r.referralId,
          wallet: r.wallet,
          email: r.email,
          createdAt: r.referredAt,
          firstSettledTx: r.firstSettledTx, // nullable
          earning: r.earning,               // nullable
          txCount: r.txCount,
        }))
        // stable sort by referred date asc
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      earningsByCurrency: Object.entries(earningsByCurrency).map(([currency, total]) => ({
        currency,
        total,
      })),
      totals: {
        txCount: txs.length,
        txVolumeByCurrency: Object.entries(volByCcy).map(([currency, total]) => ({ currency, total })),
        statusBreakdown: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
