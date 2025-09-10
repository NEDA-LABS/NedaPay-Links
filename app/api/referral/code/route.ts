import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateReferralCode } from '@/utils/referalCodes/generateCode';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/* returns privyUserId string or null */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return null;
    }

    // For Privy integration, we need to decode the JWT token directly
    // Privy access tokens are JWTs that contain user information
    try {
      // Decode the JWT without verification first to see the structure
      const decoded = jwt.decode(token) as any;
      // console.log('Decoded token payload:', decoded); //debugging
      
      if (decoded && decoded.sub) {
        // The 'sub' (subject) field typically contains the user ID
        return decoded.sub;
      }
      
    } catch (jwtError) {
      console.log('JWT decode error:', jwtError);
    }
    
    console.log('Could not extract user ID from token');
    return null;
    
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return null;
  }
}



/* GET  /api/settings/referral  →  return { code, inviteLink, invitees[] } */
export async function GET(req: NextRequest) {
  try {
    const privyUserId = await getUserIdFromRequest(req);
    if (!privyUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. load influencer row for this user
    const influencer = await prisma.influencerProfile.findFirst({
      where: { user: { privyUserId } },
      include: { user: true },
    });
    if (!influencer || !influencer.isActive || !influencer.user.isActive) {
      return NextResponse.json({ error: 'Not an active influencer' }, { status: 403 });
    }

    // 2. if code missing → generate once (race-safe unique index)
    if (!influencer.customCode) {
      const code = await generateReferralCode();
      await prisma.influencerProfile.update({
        where: { id: influencer.id },
        data: { customCode: code },
      });
      influencer.customCode = code; // use fresh code below
    }

    // 3. build invite link
    const host = process.env.NEXT_PUBLIC_HOST || 'https://nedapay.xyz';
    const inviteLink = `${host}/invite/${influencer.customCode}`;

    // 4. fetch invitees + their tx volume (example aggregation)
    const invitees = await prisma.referral.findMany({
      where: { influencerCode: influencer.customCode },
      select: {
        id: true,
        privyUserId: true,
        createdAt: true,
        // join User to grab email/wallet
        user: { select: { email: true, wallet: true } },
        // example: sum of successful payments in USD
        // _count: {
        //   select: {
        //     payments: { where: { status: 'completed' } },
        //   },
        // },
      },
    });

    // map to DTO expected by ReferralTab
    const dtoInvitees = invitees.map((inv) => ({
      id: inv.id,
      email: inv.user?.email ?? undefined,
      wallet: inv.user?.wallet ?? undefined,
      // volumeUsd: inv._count.payments * 10, // dummy calc – replace with real sum
      createdAt: inv.createdAt.toISOString(),
    }));

    const stats = {
      code: influencer.customCode,
      inviteLink,
      invitees: dtoInvitees,
    };

    return NextResponse.json(stats);
  } catch (e: any) {
    console.error('[GET /api/settings/referral]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* POST  /api/settings/referral  →  force-create a new code (idempotent) */
export async function POST(req: NextRequest) {
  try {
    const privyUserId = await getUserIdFromRequest(req);
    if (!privyUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Try to find the user first
    const user = await prisma.user.findUnique({
      where: { privyUserId },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find or create influencer profile
    let influencer = await prisma.influencerProfile.findFirst({
      where: { userId: user.id },
      include: { user: true },
    });

    // If no influencer exists, create one
    if (!influencer) {
      const code = await generateReferralCode();
      influencer = await prisma.influencerProfile.create({
        data: {
          userId: user.id,
          displayName: user.name || `User-${user.privyUserId.slice(0, 6)}`,
          customCode: code,
          isActive: true,
        },
        include: { user: true },
      });
    } 
    // If influencer exists but no code, generate one
    else if (!influencer.customCode) {
      const code = await generateReferralCode();
      influencer = await prisma.influencerProfile.update({
        where: { id: influencer.id },
        data: { customCode: code },
        include: { user: true },
      });
    }

    // Return the referral code and link
    const host = process.env.NEXT_PUBLIC_HOST || 'https://nedapay.xyz';
    const inviteLink = `${host}/invite/${influencer.customCode}`;
    
    return NextResponse.json({
      code: influencer.customCode,
      inviteLink,
    });
  } catch (e: any) {
    console.error('[POST /api/referral/code]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

