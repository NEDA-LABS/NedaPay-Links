import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '@/utils/createNotification';

const prisma = new PrismaClient();
const CLIENT_SECRET = process.env.PAYCREST_CLIENT_SECRET!;

interface WebhookStructure
  {
    "event": "payment_order.settled",
    "data": {
      "id": "uuid-string",
      "amount": "100.00",
      "amountPaid": "80.00",
      "amountReturned": "0.00",
      "percentSettled": "90.00",
      "senderFee": "0.50",
      "networkFee": "0.05",
      "rate": "1500",
      "network": "polygon",
      "gatewayId": "gw-123",
      "reference": "unique-reference",
      "senderId": "uuid-string",
      "recipient": {
        "currency": "NGN",
        "institution": "FBNINGLA",
        "accountIdentifier": "123456789",
        "accountName": "John Doe",
        "memo": "Payment from John Doe"
      },
      "fromAddress": "0x123...",
      "returnAddress": "0x123...",
      "updatedAt": "2024-06-26T12:34:56Z",
      "createdAt": "2024-06-26T12:34:56Z",
      "txHash": "abc123",
      "status": "settled"
    }
}

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
            rate: data.rate,
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
            rate: data.rate,
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
            rate: data.rate,
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
            rate: data.rate,
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
            rate: data.rate,
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
            rate: data.rate,
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
            rate: data.rate,
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