import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const application = await prisma.kYBApplication.findUnique({
      where: { wallet: walletAddress },
      select: {
        status: true,
        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      status: application?.status || 'NOT_STARTED',
      details: {
        ...application,
        createdAt: application?.createdAt
      }
    });
  } catch (error) {
    console.error('Error checking KYB status:', error);
    return NextResponse.json({ error: 'Failed to check KYB status' }, { status: 500 });
  }
}
