import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query parameters
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user with their latest Sumsub application
    const user = await prisma.user.findUnique({
      where: { wallet: walletAddress },
      include: {
        sumsubApplications: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Determine KYC status
    let kycStatus: 'not_started' | 'pending' | 'approved' | 'rejected' = 'not_started';

    if (user && user.sumsubApplications.length > 0) {
      const latestApp = user.sumsubApplications[0];
      
      if (latestApp.reviewedAt) {
        if (latestApp.reviewAnswer === 'GREEN') {
          kycStatus = 'approved';
        } else if (latestApp.reviewAnswer === 'RED') {
          kycStatus = 'rejected';
        } else {
          kycStatus = 'pending';
        }
      } else {
        kycStatus = 'pending';
      }
    }

    return NextResponse.json({ 
      kycStatus,
      applicationId: user?.sumsubApplications[0]?.id || null,
      reviewedAt: user?.sumsubApplications[0]?.reviewedAt || null
    });

  } catch (error) {
    console.error('KYC status check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}