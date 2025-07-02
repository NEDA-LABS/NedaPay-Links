import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'all';
    const user = searchParams.get('user') || 'all';
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (action !== 'all') {
      where.action = action;
    }

    if (user !== 'all') {
      where.userId = user;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { contains: search, mode: 'insensitive' } }
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}