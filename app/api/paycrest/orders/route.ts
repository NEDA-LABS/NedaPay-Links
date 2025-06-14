import { NextRequest, NextResponse } from 'next/server';
import { initiatePaymentOrder, Recipient } from '../../../utils/paycrest';

interface PaymentOrderRequest {
  amount: number;
  rate: number;
  recipient: Recipient;
  returnAddress?: string;
  reference?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PaymentOrderRequest;

    // Validate payload
    if (!body.amount || !body.rate || !body.recipient) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const order = await initiatePaymentOrder({
      amount: body.amount,
      rate: body.rate,
      network: 'base',
      token: 'USDC',
      recipient: body.recipient,
      returnAddress: body.returnAddress,
      reference: body.reference,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error initiating payment order:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}