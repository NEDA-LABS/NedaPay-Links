import { NextRequest, NextResponse } from 'next/server';
import { initiatePaymentOrder, Recipient, fetchAllOrders } from '../../../utils/paycrest';

interface PaymentOrderRequest {
  amount: number;
  rate: number;
  recipient: Recipient;
  returnAddress?: string;
  reference?: string;
}


// export async function GET(req: NextRequest) {
//   console.log("debugging orders req",req)
//   try {
//     const { searchParams } = new URL(req.url);
    
//     const params = {
//       ordering: searchParams.get('ordering') || undefined,
//       status: searchParams.get('status') || undefined,
//       token: searchParams.get('token') || undefined,
//       network: searchParams.get('network') || undefined,
//       page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
//       pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
//     };

//     const orders = await fetchAllOrders(params);
    
    
//     return NextResponse.json(orders);
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch orders' },
//       { status: 500 }
//     );
//   }
// }

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