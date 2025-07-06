import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ApplicationStatus } from '@prisma/client';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action, reviewerNotes, adminAddress } = await req.json();
    if (!adminAddress) {
      return NextResponse.json({ error: 'Admin address is required' }, { status: 400 });
    }
    
    const applicationId = (await params).id;
    const notes = reviewerNotes || '';

    // Determine application type
    const kycApp = await prisma.kYCApplication.findUnique({ where: { id: applicationId } });
    const kybApp = await prisma.kYBApplication.findUnique({ where: { id: applicationId } });
    
    if (!kycApp && !kybApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const isKYC = !!kycApp;
    const appType = isKYC ? 'KYC' : 'KYB';

    // Update application status
    const updateData = {
      status: action === 'approve' ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED,
      
      ...(action === 'approve' ? { approvedAt: new Date() } : { rejectedAt: new Date() })
    };

    // Create or update ApplicationReview
    const reviewData = {
      reviewerId: adminAddress,
      status: updateData.status,
      comments: notes,
      reviewedAt: new Date(),
      kycApplicationId: isKYC ? applicationId : null,
      kybApplicationId: isKYC ? null : applicationId
    };

    await prisma.applicationReview.create({
      data: reviewData
    });

    // Update application status
    if (isKYC) {
      await prisma.kYCApplication.update({
        where: { id: applicationId },
        data: updateData
      });
    } else {
      await prisma.kYBApplication.update({
        where: { id: applicationId },
        data: updateData
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: adminAddress,
        action: `${appType}_${action.toUpperCase()}`,
        entityType: appType,
        entityId: applicationId,
        changes: JSON.stringify({
          status: updateData.status,
          reviewerId: adminAddress
        }),
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}