// api/kotani/offramp.js
import kotaniPay from '@api/kotani-pay';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      amount, 
      currency, 
      customerKey, 
      walletAddress, 
      provider,
      receiverType, // 'mobile' or 'bank'
      referenceId,
      // Mobile money receiver fields
      phoneNumber,
      accountName,
      networkProvider,
      // Bank receiver fields
      name,
      address,
      bankCode,
      accountNumber,
      country
    } = req.body;

    const token = process.env.KOTANI_API_KEY || '';
    
    // Authenticate with Kotani API
    kotaniPay.auth(token);

    // First, get the exchange rate to calculate the exact amounts
    try {
      const rateData = await kotaniPay.rateController_getOffRampRates({
        from: 'USDC',
        to: currency,
        cryptoAmount: parseFloat(amount)
      });

      console.log('Exchange rate data:', rateData.data);
    } catch (rateError) {
      console.error('Rate fetch error:', rateError);
      throw new Error('Failed to get exchange rate');
    }

    // Prepare receiver object based on type
    let receiverConfig = {};
    
    if (receiverType === 'mobile') {
      receiverConfig = {
        mobileMoneyReceiver: {
          phoneNumber,
          accountName,
          networkProvider
        }
      };
    } else if (receiverType === 'bank') {
      receiverConfig = {
        bankReceiver: {
          name,
          address,
          phoneNumber,
          bankCode: parseInt(bankCode),
          accountNumber,
          country
        }
      };
    } else {
      throw new Error('Invalid receiver type. Must be "mobile" or "bank"');
    }

    // Create the offramp request
    const offrampData = await kotaniPay.offRampController_createOfframp({
      ...receiverConfig,
      cryptoAmount: parseFloat(amount),
      currency,
      chain: 'BASE',
      token: 'USDC',
      referenceId: referenceId || `offramp_${Date.now()}`, // Generate reference ID if not provided
      senderAddress: walletAddress
    });

    res.status(200).json(offrampData.data);

  } catch (error: unknown) {
    console.error('Offramp error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process offramp'
    });
  }
}