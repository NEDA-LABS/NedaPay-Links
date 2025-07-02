import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';

    const where: any = {};
    
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } }
      ];
    }

    let applications: any[] = [];
    
    if (type === 'all' || type === 'KYC') {
      const kycApps = await prisma.kYCApplication.findMany({
        where: { ...where },
        include: { documents: true }
      });
      applications = [...applications, ...kycApps.map(app => ({ ...app, type: 'KYC' }))];
    }
    
    if (type === 'all' || type === 'KYB') {
      const kybApps = await prisma.kYBApplication.findMany({
        where: { ...where },
        include: { documents: true }
      });
      applications = [...applications, ...kybApps.map(app => ({ ...app, type: 'KYB' }))];
    }

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}