import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { privyDid, email, code, influencer, bonus, wallet } = await req.json();
  
    // 1. validate code still exists & active
    const profile = await prisma.influencerProfile.findFirst({
      where: { customCode: code, isActive: true, user: { isActive: true } },
    });
    if (!profile) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

    // 1.5 Create user if they don't exist
    const user = await prisma.user.upsert({
      where: { privyUserId: privyDid },
      update: {}, // in case user exists, don't update anything
      create: {
        privyUserId: privyDid,
        email: email || null,
        wallet: wallet || null,
        isActive: true,
      },
    });
  
    // 2. record referral (upsert = idempotent)
    await prisma.referral.upsert({
      where: { privyUserId: privyDid },
      update: {}, // already claimed
      create: {
        privyUserId: privyDid,
        influencerCode: code,
        influencerName: influencer,
        bonusSnapshot: bonus,
      },
    });
  
    // 3. (optional) bump counter on influencer
    await prisma.influencerProfile.update({
      where: { id: profile.id },
      data: { totalReferrals: { increment: 1 } },
    });
  
    return NextResponse.json({ ok: true });
  }