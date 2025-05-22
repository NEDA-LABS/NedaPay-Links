import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Setup Nodemailer transporter with Mailtrap
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER!,
    pass: process.env.MAILTRAP_PASS!,
  },
});

export async function POST(req: Request) {
  try {
    const { merchantId, recipient, email, paymentCollection, dueDate, currency, lineItems } = await req.json();

    // setting data type "any" for fast functionality testing — updates later for proper data handling
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

    const htmlItems = lineItems
      .map(
        (item: any) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.amount}</td>
        </tr>
      `,
      )
      .join('');

    const htmlContent = `
      <h2>Invoice Details</h2>
      <p>Merchant ID: ${merchantId}</p>
      <p>Recipient: ${recipient}</p>
      <p>Email: ${email}</p>
      <p>Payment Collection: ${paymentCollection}</p>
      <p>Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
      <p>Currency: ${currency}</p>
      <p>Total Amount: ${totalAmount}</p>
      <table>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
        ${htmlItems}
      </table>
    `;

    // Send email using Nodemailer
    await transporter.sendMail({
      from: `"Invoice Service" <nedapay@demomailtrap.co>`,
      to: email,
      subject: `New Invoice from ${merchantId}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

