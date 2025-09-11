// /app/api/analytics/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/utils/privyUserIdFromRequest";

const prisma = new PrismaClient()

// Replace with your own admin check.
async function assertAdmin(req: NextRequest) {
  const privyUserId = await getUserIdFromRequest(req);
  if (!privyUserId) return null;
  // Example: merchant settings existence or a special table/role
  const settings = await prisma.merchantSettings.findUnique({
    where: { userId: privyUserId },
  });
  // TODO: Plug your real admin logic. For now, treat presence as privileged.
  return settings ? privyUserId : null;
}

const toNum = (s: string | null | undefined) => {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export async function GET() {
  try {
    // const privyUserId = await assertAdmin(req);
    // if (!privyUserId)
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all influencers and their referral codes
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

    // Preload referrals per influencer
    const codes = influencers.map((i) => i.customCode);
    const referralsByCode = await prisma.referral.groupBy({
      by: ["influencerCode"],
      _count: { _all: true },
      where: { influencerCode: { in: codes } },
    });

    const referralCounts = new Map(
      referralsByCode.map((r) => [r.influencerCode, r._count._all])
    );

    // OffRamp transactions volume grouped by influencer (assuming merchantId is influencer.userId)
    const offramps = await prisma.offRampTransaction.findMany({
      select: { merchantId: true, currency: true, amount: true, status: true },
    });

    const byInfluencer: Record<
      string,
      {
        volumeByCurrency: Record<string, number>;
        count: number;
        status: Record<string, number>;
      }
    > = {};

    for (const tx of offramps) {
      const key = tx.merchantId;
      if (!byInfluencer[key])
        byInfluencer[key] = { volumeByCurrency: {}, count: 0, status: {} };
      const curr = tx.currency || "UNK";
      byInfluencer[key].volumeByCurrency[curr] =
        (byInfluencer[key].volumeByCurrency[curr] ?? 0) + toNum(tx.amount);
      byInfluencer[key].count += 1;
      const s = tx.status || "UNKNOWN";
      byInfluencer[key].status[s] = (byInfluencer[key].status[s] ?? 0) + 1;
    }

    const rows = influencers.map((inf) => {
      const agg = byInfluencer[inf.userId] ?? {
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

    // Totals across platform
    const totals = {
      influencers: influencers.length,
      totalReferrals: referralsByCode.reduce(
        (acc, r) => acc + r._count._all,
        0
      ),
      offrampTxCount: offramps.length,
      offrampVolumeByCurrency: Object.entries(
        Object.values(byInfluencer).reduce(
          (acc, v) => {
            for (const [c, t] of Object.entries(v.volumeByCurrency))
              acc[c] = (acc[c] ?? 0) + t;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([currency, total]) => ({ currency, total })),
    };

    return NextResponse.json({ rows, totals });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
