import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const merchantId = url.searchParams.get('merchantId');
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Validate merchantId
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    // Build where clause for filtering
    const where: any = { merchantId };
    if (status) {
      where.status = status.toLowerCase();
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        paymentLink: { select: { url: true } },
      },
    });

    // Get total count for pagination
    const totalInvoices = await prisma.invoice.count({ where });
    const totalPages = Math.ceil(totalInvoices / limit);

    // Format response to match frontend expectations
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      createdAt: invoice.createdAt.toISOString(),
      recipient: invoice.recipient,
      email: invoice.email,
      status: invoice.status,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      paymentLink: invoice.paymentLink,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}