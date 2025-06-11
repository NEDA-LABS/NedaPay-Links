// api/kotani/webhook.js - Handle webhook notifications
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const webhookData = req.body;
      
      // Log the webhook data (in production, you might want to store this in a database)
      console.log('Kotani Pay Webhook:', webhookData);
      
      // Here you can implement logic to:
      // 1. Update your database with transaction status
      // 2. Send notifications to users
      // 3. Trigger other business logic
      
      // Respond to Kotani Pay that webhook was received successfully
      res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }