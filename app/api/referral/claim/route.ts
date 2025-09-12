import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { privyDid, email, code, influencer, bonus, wallet } = await req.json();
  
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { privyUserId: privyDid },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'User already exists',
          redirectTo: '/'
        }, 
        { status: 400 }
      );
    }
    
    // 2. validate code still exists & active
    const profile = await prisma.influencerProfile.findFirst({
      where: { customCode: code, isActive: true, user: { isActive: true } },
    });
    if (!profile) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

    // 3. Create new user
    const user = await prisma.user.create({
      data: {
        privyUserId: privyDid,
        email: email || null,
        wallet: wallet || null,
        isActive: true,
      },
    });
  
    // 4. record referral
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
  
    // 5. (optional) bump counter on influencer
    await prisma.influencerProfile.update({
      where: { id: profile.id },
      data: { totalReferrals: { increment: 1 } },
    });
  
    return NextResponse.json({ ok: true });
  }