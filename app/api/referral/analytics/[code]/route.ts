// app/api/referral/analytics/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toNum = (s: string | null | undefined) => {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = decodeURIComponent(params.code);

    // 1) Influencer by referral code
    const influencer = await prisma.influencerProfile.findUnique({
      where: { customCode: code },
      include: {
        user: { select: { id: true, email: true, wallet: true } },
      },
    });

    if (!influencer) {
      return NextResponse.json(
        { error: "Influencer not found" },
        { status: 404 }
      );
    }

    // 2) All referrals for this code
    const referrals = await prisma.referral.findMany({
      where: { influencerCode: code },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, email: true, wallet: true, name: true } },
      },
    });

    // 3) For each referral user, fetch their off-ramps by merchantId == user.wallet
    const wallets = referrals
      .map((r) => r.user?.wallet)
      .filter((w): w is string => Boolean(w));

    const txs = wallets.length
      ? await prisma.offRampTransaction.findMany({
          where: { merchantId: { in: wallets } },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            merchantId: true, // user.wallet of the referred user
            amount: true,
            rate: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        })
      : [];

    // Index transactions by wallet
    const byWallet = new Map<
      string,
      {
        id: string;
        merchantId: string;
        amount: string;
        rate: string;
        currency: string;
        status: string;
        createdAt: Date;
      }[]
    >();
    for (const t of txs) {
      const k = t.merchantId;
      const arr = byWallet.get(k) ?? [];
      arr.push(t);
      byWallet.set(k, arr);
    }

    // 4) Build rows with per-referral transactions & earning
    const referralRows = referrals.map((r) => {
      const wallet = r.user?.wallet ?? "";
      const allTx = wallet ? byWallet.get(wallet) ?? [] : [];

      const settled = allTx.filter(
        (t) => (t.status || "").toLowerCase() === "settled"
      );
      const firstSettled = settled[0];

      const earning = firstSettled
        ? {
            amount: Number((0.1 * toNum(firstSettled.amount) * toNum(firstSettled.rate)).toFixed(8)),
            currency: firstSettled.currency,
            sourceTxId: firstSettled.id,
          }
        : null;

      return {
        referralId: r.id,
        createdAt: r.createdAt,
        user: {
          email: r.user?.email ?? "",
          wallet,
          name: r.user?.name ?? null,
        },
        transactions: allTx.map((t) => ({
          id: t.id,
          amount: toNum(t.amount) * toNum(t.rate),
          currency: t.currency,
          status: t.status,
          createdAt: t.createdAt,
        })),
        firstSettled:
          firstSettled
            ? {
                id: firstSettled.id,
                amount: toNum(firstSettled.amount) * toNum(firstSettled.rate),
                currency: firstSettled.currency,
                createdAt: firstSettled.createdAt,
              }
            : null,
        earning, // 10% of first settled off-ramp
      };
    });

    // 5) Influencer-level rollups (sum of earnings, tx counts, etc.)
    const totals = {
      referrals: referralRows.length,
      totalTx: referralRows.reduce((acc, r) => acc + r.transactions.length, 0),
      totalEarningsByCurrency: (() => {
        const bag: Record<string, number> = {};
        for (const r of referralRows) {
          if (r.earning) {
            const { currency, amount } = r.earning;
            bag[currency] = (bag[currency] ?? 0) + amount;
          }
        }
        return Object.entries(bag).map(([currency, total]) => ({
          currency,
          total,
        }));
      })(),
      offrampVolumeByCurrency: (() => {
        const bag: Record<string, number> = {};
        for (const r of referralRows) {
          for (const t of r.transactions) {
            bag[t.currency] = (bag[t.currency] ?? 0) + t.amount;
          }
        }
        return Object.entries(bag).map(([currency, total]) => ({
          currency,
          total,
        }));
      })(),
    };

    return NextResponse.json({
      influencer: {
        code: influencer.customCode,
        displayName: influencer.displayName,
        email: influencer.user?.email ?? "",
        wallet: influencer.user?.wallet ?? "",
        isActive: influencer.isActive,
      },
      totals,
      referrals: referralRows,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
