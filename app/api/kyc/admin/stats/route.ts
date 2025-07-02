import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const [totalVerifications, pendingKYC, pendingKYB, completedToday, rejectedToday] = await Promise.all([
    await prisma.kYCApplication.count() + await prisma.kYBApplication.count(),
    await prisma.kYCApplication.count({ where: { status: 'SUBMITTED' } }),
    await prisma.kYBApplication.count({ where: { status: 'SUBMITTED' } }),
    await prisma.kYCApplication.count({
        where: {
          approvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }) + await prisma.kYBApplication.count({
        where: {
          approvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
    await prisma.kYCApplication.count({
        where: {
          rejectedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }) + await prisma.kYBApplication.count({
        where: {
          rejectedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
    // await prisma.kYCApplication.count({ where: { riskLevel: 'HIGH' } }) + 
    // await prisma.kYBApplication.count({ where: { riskLevel: 'HIGH' } })
    ]);

    return NextResponse.json({
      totalVerifications,
      pendingKYC,
      pendingKYB,
      completedToday,
      rejectedToday,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}