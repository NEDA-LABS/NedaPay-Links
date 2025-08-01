import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';

const prisma = new PrismaClient();
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Max requests per window

// Rate limiting middleware
const rateLimit = async (ip: string) => {
  const key = `rate_limit:${ip}`;
  const requests = await redis.get(key);
  const currentRequests = requests ? parseInt(requests as string) : 0;

  if (currentRequests >= MAX_REQUESTS) {
    return false;
  }

  await redis.multi()
    .incr(key)
    .pexpire(key, RATE_LIMIT_WINDOW)
    .exec();

  return true;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  if (!(await rateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const resolvedParams = await params;
  const link = await prisma.paymentLink.findUnique({
    where: { linkId: resolvedParams.id },
  });

  if (!link) {
    return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
  }

  // Common validation for both link types
  if (link.status !== 'Active') {
    return NextResponse.json({ error: 'Payment link is not active' }, { status: 400 });
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    await prisma.paymentLink.update({
      where: { linkId: resolvedParams.id },
      data: { status: 'Expired' },
    });
    return NextResponse.json({ error: 'Payment link has expired' }, { status: 400 });
  }

  // Additional validation for offramp links
  if (link.linkType === 'OFF_RAMP') {
    // Validate offramp type
    if (!link.offRampType || !['PHONE', 'BANK_ACCOUNT'].includes(link.offRampType)) {
      return NextResponse.json({ error: 'Invalid off-ramp configuration' }, { status: 400 });
    }

    // Validate offramp value
    if (!link.offRampValue) {
      return NextResponse.json({ 
        error: link.offRampType === 'PHONE' 
          ? 'Phone number is missing' 
          : 'Bank account is missing' 
      }, { status: 400 });
    }

    // Validate offramp provider
    if (!link.offRampProvider) {
      return NextResponse.json({ 
        error: link.offRampType === 'PHONE' 
          ? 'Mobile network is missing' 
          : 'Bank is missing' 
      }, { status: 400 });
    }

    // Validate account name for bank transfers
    if (!link.accountName) {
      return NextResponse.json({ error: 'Account name is missing' }, { status: 400 });
    }
  }

  // Return success response with link type information
  return NextResponse.json({ 
    valid: true,
    linkType: link.linkType,
    ...(link.linkType === 'OFF_RAMP' && {
      offRampType: link.offRampType,
      offRampProvider: link.offRampProvider
    })
  });
}