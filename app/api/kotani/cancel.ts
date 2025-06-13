// api/kotani/cancel.ts
import kotaniPay from '@api/kotani-pay';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { referenceId } = req.body;
    
    if (!referenceId) {
      return res.status(400).json({ error: 'Reference ID is required' });
    }

    const token = process.env.KOTANI_API_KEY;
    
    if (!token) {
      return res.status(500).json({ error: 'API token not configured' });
    }
    
    kotaniPay.auth(token);
    const cancelData = await kotaniPay.offRampController_getCancelTransaction({
      referenceId
    });

    res.status(200).json(cancelData.data);
  } catch (error: unknown) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel transaction'
    });
  }
}