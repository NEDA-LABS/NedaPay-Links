// api/kotani/offramp.js
import { getAuthToken } from './auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, customerKey, walletAddress, provider } = req.body;
    const token = await getAuthToken();

    // First, get the exchange rate to calculate the exact amounts
    const rateResponse = await fetch(`${process.env.KOTANI_API_BASE || 'https://sandbox-api.kotanipay.io/v3'}/rates/offramp-exchange-rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromCurrency: 'USDC',
        toCurrency: currency,
        amount: parseFloat(amount)
      })
    });

    if (!rateResponse.ok) {
      throw new Error('Failed to get exchange rate');
    }

    const rateData = await rateResponse.json();

    // Now create the offramp request
    const offrampResponse = await fetch(`${process.env.KOTANI_API_BASE || 'https://sandbox-api.kotanipay.io/v3'}/offramp/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerKey,
        amount: parseFloat(amount), // USDC amount
        fromCurrency: 'USDC',
        toCurrency: currency,
        provider,
        walletAddress,
        network: 'BASE', // Specify Base network
        webhookUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/kotani/webhook`
      })
    });

    if (!offrampResponse.ok) {
      const errorData = await offrampResponse.json();
      throw new Error(errorData.message || 'Failed to create offramp request');
    }

    const offrampData = await offrampResponse.json();
    res.status(200).json(offrampData);
  } catch (error) {
    console.error('Offramp error:', error);
    res.status(500).json({ error: error.message || 'Failed to process offramp' });
  }
}