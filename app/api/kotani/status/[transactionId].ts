// api/kotani/status/[transactionId].js
import { getAuthToken } from '../auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactionId } = req.query;
    const token = await getAuthToken();

    const response = await fetch(`${process.env.KOTANI_API_BASE || 'https://sandbox-api.kotanipay.io/v3'}/offramp/mobile-money/status?transactionId=${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction status');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction status' });
  }
}