import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = await params.id;

    // Check KYC applications
    const kycApp = await prisma.kYCApplication.findUnique({
      where: { id: applicationId },
      include: {
        documents: true,
        reviews: { orderBy: { reviewedAt: 'desc' } }
      }
    });

    if (kycApp) {
      return NextResponse.json({ ...kycApp, type: 'KYC' });
    }

    // Check KYB applications
    const kybApp = await prisma.kYBApplication.findUnique({
      where: { id: applicationId },
      include: {
        documents: true,
        reviews: { orderBy: { reviewedAt: 'desc' } }
      }
    });

    if (kybApp) {
      return NextResponse.json({ ...kybApp, type: 'KYB' });
    }

    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}