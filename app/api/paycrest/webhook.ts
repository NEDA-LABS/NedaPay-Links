import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const CLIENT_SECRET = process.env.PAYCREST_CLIENT_SECRET!;

function verifyPaycrestSignature(requestBody: string, signatureHeader: string): boolean {
  const calculatedSignature = crypto
    .createHmac('sha256', Buffer.from(CLIENT_SECRET))
    .update(requestBody)
    .digest('hex');
  return signatureHeader === calculatedSignature;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const signature = req.headers['x-paycrest-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  if (!signature || !verifyPaycrestSignature(rawBody, signature)) {
    return res.status(401).json({ message: 'Invalid Signature' });
  }

  const { event, data } = req.body;

  switch (event) {
    case 'payment_order.pending':
      console.log('Payment order pending:', data);
      // Handle pending event (e.g., update database)
      break;
    case 'payment_order.settled':
      console.log('Payment order settled:', data);
      // Handle settled event
      break;
    case 'payment_order.expired':
      console.log('Payment order expired:', data);
      // Handle expired event
      break;
    case 'payment_order.refunded':
      console.log('Payment order refunded:', data);
      // Handle refunded event
      break;
    default:
      console.log('Unknown event:', event);
  }

  return res.status(200).json({ message: 'Webhook received' });
}