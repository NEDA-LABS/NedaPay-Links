import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';

const prisma = new PrismaClient();
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

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

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!(await rateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantId');
  if (!merchantId || !/^0x[a-fA-F0-9]{40}$/.test(merchantId)) {
    return NextResponse.json({ error: 'Invalid merchantId' }, { status: 400 });
  }

  const links = await prisma.paymentLink.findMany({
    where: { 
      merchantId,
      status: 'Active',
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!(await rateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const data = await req.json();
  const { 
    merchantId, 
    amount, 
    currency, 
    description, 
    status, 
    expiresAt, 
    linkId,
    linkType = 'NORMAL',
    offRampType,
    offRampValue,
    accountName,
    offRampProvider,
    chainId
  } = data;

  // Base validation for all links
  if (!merchantId || !currency || !status || !expiresAt || !linkId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(merchantId)) {
    return NextResponse.json({ error: 'Invalid merchantId format' }, { status: 400 });
  }

  // Validate amount based on link type
  let parsedAmount = 0;
  if (linkType === 'OFF_RAMP') {
    if (!amount) {
      return NextResponse.json({ error: 'Amount is required for off-ramp links' }, { status: 400 });
    }
    parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount for off-ramp link' }, { status: 400 });
    }
  } else { // NORMAL link
    if (amount) {
      parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return NextResponse.json({ error: 'Invalid amount format' }, { status: 400 });
      }
    }
    // If no amount provided for normal link, set to 0 (open amount)
    parsedAmount = parsedAmount || 0;
  }

  // Validate currency
  if (!/^[A-Z]{3,10}$/i.test(currency)) {
    return NextResponse.json({ error: 'Invalid currency format' }, { status: 400 });
  }

  // Validate description
  if (description && description.length > 1000) {
    return NextResponse.json({ error: 'Description too long' }, { status: 400 });
  }

  // Validate status
  if (status !== 'Active') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Validate expiration date
  let expiresAtDate: Date;
  try {
    expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return NextResponse.json({ error: 'Invalid expiration date' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid expiration date format' }, { status: 400 });
  }

  // Off-ramp specific validation
  if (linkType === 'OFF_RAMP') {
    if (!offRampType || !['PHONE', 'BANK_ACCOUNT'].includes(offRampType)) {
      return NextResponse.json({ error: 'Invalid off-ramp type' }, { status: 400 });
    }
    
    if (!offRampValue) {
      return NextResponse.json({ 
        error: offRampType === 'PHONE' 
          ? 'Phone number is required' 
          : 'Bank account is required' 
      }, { status: 400 });
    }
    
    if (!offRampProvider) {
      return NextResponse.json({ 
        error: offRampType === 'PHONE' 
          ? 'Mobile network is required' 
          : 'Bank name is required' 
      }, { status: 400 });
    }
    
    if (offRampType === 'BANK_ACCOUNT' && !accountName) {
      return NextResponse.json({ error: 'Account name is required for bank transfers' }, { status: 400 });
    }
  }

  // Generate payment link URL and HMAC signature
  const getBaseUrl = (req: NextRequest) => {
    if (req) {
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const host = req.headers.get('host');
      return `${protocol}://${host}`;
    }
    return typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:3000';
  };

  const baseUrl = getBaseUrl(req);
  
  // Prepare query parameters
  const queryParams = new URLSearchParams({
    amount: parsedAmount.toString(),
    currency,
    to: merchantId,
    ...(description && { description: encodeURIComponent(description) }),
    ...(linkType === 'OFF_RAMP' && offRampType && { offRampType }),
    ...(linkType === 'OFF_RAMP' && offRampValue && { offRampValue }),
    ...(linkType === 'OFF_RAMP' && accountName && { accountName: encodeURIComponent(accountName) }),
    ...(linkType === 'OFF_RAMP' && offRampProvider && { offRampProvider: encodeURIComponent(offRampProvider) }),
    ...(chainId && { chainId: chainId.toString() })
  }).toString();

  const signature = crypto.createHmac('sha256', process.env.HMAC_SECRET || 'default-secret')
    .update(queryParams)
    .digest('hex');
    
  const url = `${baseUrl}/pay/${linkId}?${queryParams}&sig=${signature}`;

  try {
    const newLink = await prisma.paymentLink.create({
      data: {
        merchantId,
        url,
        amount: parsedAmount,
        currency,
        description,
        status,
        expiresAt: expiresAtDate,
        signature,
        linkId,
        linkType,
        offRampType,
        offRampValue,
        accountName,
        offRampProvider,
        chainId
      },
    });
    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}