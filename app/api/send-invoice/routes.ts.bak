// pages/api/create-invoice.ts
import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { merchantId, recipient, email, paymentCollection, dueDate, currency, lineItems } = req.body;

//setting data type "any" for fast functionality testing updates later fro proper data handling ---------------important!
  try {
    const totalAmount = lineItems.reduce((sum: any, item: any) => sum + parseFloat(item.amount || 0), 0);
    const invoice = await prisma.invoice.create({
      data: {
        merchantId,
        recipient,
        email,
        paymentCollection,
        dueDate: new Date(dueDate),
        currency,
        totalAmount,
        status: 'draft',
        lineItems: {
          create: lineItems.map((item: any) => ({
            description: item.description,
            amount: parseFloat(item.amount || 0),
          })),
        },
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
}