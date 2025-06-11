// api/kotani/exchange-rate.js
import { getAuthToken } from './auth';

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    const token = await getAuthToken();

    const response = await fetch(`${process.env.KOTANI_API_BASE || 'https://sandbox-api.kotanipay.io/v3'}/rates/offramp-exchange-rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount)
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Exchange rate error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
}