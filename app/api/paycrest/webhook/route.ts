import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '@/utils/createNotification';

const prisma = new PrismaClient();
const CLIENT_SECRET = process.env.PAYCREST_CLIENT_SECRET!;

function verifyPaycrestSignature(requestBody: string, signatureHeader: string): boolean {
  const calculatedSignature = crypto
    .createHmac('sha256', Buffer.from(CLIENT_SECRET))
    .update(requestBody)
    .digest('hex');
  return signatureHeader === calculatedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paycrest-signature');
    const body = await request.json();
    const rawBody = JSON.stringify(body);

    if (!signature || !verifyPaycrestSignature(rawBody, signature)) {
      return NextResponse.json({ message: 'Invalid Signature' }, { status: 401 });
    }

    const { event, data } = body;

    switch (event) {
      case 'payment_order.pending':
        // console.log('Payment order pending:', data);
        // Create new transaction record as pending
        await prisma.offRampTransaction.create({
          data: {
            id: data.id,
            merchantId: data.fromAddress,
            status: 'pending',
            amount: data.amount,
            currency: data.recipient?.currency,
            accountName: data.recipient?.accountName,
            accountNumber: data.recipient?.accountIdentifier,
            institution: data.recipient?.institution
          }
        });
        break;

      case 'payment_order.settled':

      // create notification
      await createNotification(data.id, data.fromAddress, ((parseFloat(data.amount)/0.95)).toString(), data.recipient?.currency, data.recipient?.accountName);
        // console.log('Payment order settled:', data);
        // Update transaction status to settled
        await prisma.offRampTransaction.upsert({
          where: { id: data.id },
          update: {
            status: 'settled',
            merchantId: data.fromAddress,
            amount: data.amount,
            currency: data.recipient?.currency,
            accountName: data.recipient?.accountName,
            accountNumber: data.recipient?.accountIdentifier,
            institution: data.recipient?.institution
          },
          create: {
            id: data.id,
            merchantId: data.fromAddress,
            status: 'settled',
            amount: data.amount,
            currency: data.recipient?.currency,
            accountName: data.recipient?.accountName,
            accountNumber: data.recipient?.accountIdentifier,
            institution: data.recipient?.institution
          }
        });
        break;

      case 'payment_order.expired':
        // console.log('Payment order expired:', data);
        // Update transaction status to expired
        await prisma.offRampTransaction.upsert({
          where: { id: data.id },
          update: {
            status: 'expired',
            merchantId: data.fromAddress,
            amount: data.amount,
            currency: data.recipient?.currency,
            accountName: data.recipient?.accountName,
            accountNumber: data.recipient?.accountIdentifier,
            institution: data.recipient?.institution
          },
          create: {
            id: data.id,
            merchantId: data.fromAddress,
            status: 'expired',
            amount: data.amount,
            currency: data.recipient?.currency,
            accountName: data.recipient?.accountName,
            accountNumber: data.recipient?.accountIdentifier,
            institution: data.recipient?.institution
          }
        });
        break;

      case 'payment_order.refunded':
        // console.log('Payment order refunded:', data);
        // Update transaction status to refunded
        await prisma.offRampTransaction.upsert({
          where: { id: data.id },
          update: {
            status: 'refunded',
            merchantId: data.fromAddress,
            amount: data.amount,
            currency: data.recipient?.currency,
            accountName: data.recipient?.accountName,
            accountNumber: data.recipient?.accountIdentifier,
            institution: data.recipient?.institution
          },
          create: {
            id: data.id,
            merchantId: data.fromAddress,
            status: 'refunded',
            amount: data.amount,
            currency: data.recipient?.currency,
            accountName: data.recipient?.accountName,
            accountNumber: data.recipient?.accountIdentifier,
            institution: data.recipient?.institution
          }
        });
        break;

      default:
        console.log('Unknown event:', event);
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}