// api/kotani/create-customer.js
import { getAuthToken } from './auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, provider, walletAddress } = req.body;
    const token = await getAuthToken();

    const response = await fetch(`${process.env.KOTANI_API_BASE || 'https://sandbox-api.kotanipay.io/v3'}/customers/mobile-money`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        provider,
        walletAddress,
        country: 'TZ', // Tanzania
        currency: 'TZS'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create customer');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
}