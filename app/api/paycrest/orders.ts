import { NextApiRequest, NextApiResponse } from 'next';
import { initiatePaymentOrder } from '../../utils/paycrest';
import { usePrivy } from '@privy-io/react-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { ready, authenticated, user, login } = usePrivy();
  if (!ready || !authenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { amount, rate, recipient, returnAddress, reference } = req.body;

    // Validate payload
    if (!amount || !rate || !recipient) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const order = await initiatePaymentOrder({
      amount,
      rate,
      network: 'base',
      token: 'USDC',
      recipient,
      returnAddress,
      reference,
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error('Error initiating payment order:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}