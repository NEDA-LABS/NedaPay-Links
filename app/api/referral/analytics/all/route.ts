// app/api/referral/analytics/all/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toNum = (s: string | null | undefined) => {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export async function GET() {
  try {
    // 1) Get all influencers (and their wallets/emails)
    const influencers = await prisma.influencerProfile.findMany({
      select: {
        id: true,
        userId: true,
        displayName: true,
        customCode: true,
        isActive: true,
        user: { select: { email: true, wallet: true } },
      },
    });

    // 2) All referrals grouped by code
    const codes = influencers.map((i) => i.customCode);
    const referralsByCode = await prisma.referral.groupBy({
      by: ["influencerCode"],
      _count: { _all: true },
      where: { influencerCode: { in: codes } },
    });

    const referralCounts = new Map(
      referralsByCode.map((r) => [r.influencerCode, r._count._all])
    );

    // 3) We need to attribute off-ramps to the *referred users*.
    //    Strategy:
    //    - Pull referred users (their wallets)
    //    - Map wallet -> influencerCode via Referral
    const referrals = await prisma.referral.findMany({
      where: { influencerCode: { in: codes } },
      select: {
        influencerCode: true,
        user: { select: { wallet: true } },
      },
    });

    const walletToCode = new Map<string, string>();
    for (const r of referrals) {
      const w = r.user?.wallet;
      if (w) walletToCode.set(w, r.influencerCode);
    }

    // 4) Fetch all off-ramp transactions
    const offramps = await prisma.offRampTransaction.findMany({
      select: { merchantId: true, currency: true, amount: true, status: true },
    });

    // 5) Attribute off-ramps to influencer via (merchantId == user.wallet) -> referral.influencerCode
    const byInfluencerCode: Record<
      string,
      {
        volumeByCurrency: Record<string, number>;
        count: number;
        status: Record<string, number>;
      }
    > = {};

    for (const tx of offramps) {
      const wallet = tx.merchantId; // equals User.wallet
      if (!wallet) continue;

      const code = walletToCode.get(wallet);
      if (!code) continue; // off-ramp not from a referred user

      if (!byInfluencerCode[code]) {
        byInfluencerCode[code] = {
          volumeByCurrency: {},
          count: 0,
          status: {},
        };
      }
      const curr = tx.currency || "UNK";
      byInfluencerCode[code].volumeByCurrency[curr] =
        (byInfluencerCode[code].volumeByCurrency[curr] ?? 0) + toNum(tx.amount);
      byInfluencerCode[code].count += 1;
      const s = tx.status || "UNKNOWN";
      byInfluencerCode[code].status[s] = (byInfluencerCode[code].status[s] ?? 0) + 1;
    }

    const rows = influencers.map((inf) => {
      const agg = byInfluencerCode[inf.customCode] ?? {
        volumeByCurrency: {},
        count: 0,
        status: {},
      };
      const volume = Object.entries(agg.volumeByCurrency).map(
        ([currency, total]) => ({ currency, total })
      );

      return {
        influencer: inf.displayName,
        code: inf.customCode,
        email: inf.user?.email ?? "",
        wallet: inf.user?.wallet ?? "",
        referrals: referralCounts.get(inf.customCode) ?? 0,
        offrampTx: agg.count,
        volumeByCurrency: volume,
      };
    });

    // 6) Totals across platform
    const totals = {
      influencers: influencers.length,
      totalReferrals: referralsByCode.reduce((acc, r) => acc + r._count._all, 0),
      offrampTxCount: Object.values(byInfluencerCode).reduce(
        (acc, v) => acc + v.count,
        0
      ),
      offrampVolumeByCurrency: Object.entries(
        Object.values(byInfluencerCode).reduce((acc, v) => {
          for (const [c, t] of Object.entries(v.volumeByCurrency))
            acc[c] = (acc[c] ?? 0) + t;
          return acc;
        }, {} as Record<string, number>)
      ).map(([currency, total]) => ({ currency, total })),
    };

    return NextResponse.json({ rows, totals });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
