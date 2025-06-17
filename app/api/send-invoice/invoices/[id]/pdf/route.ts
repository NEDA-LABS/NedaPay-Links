import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { Readable, Writable } from 'stream';
import { Buffer } from 'buffer';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { lineItems: true, paymentLink: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    // Convert PDF stream to Buffer
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.id}.pdf"`,
        },
      });
    });

    // Basic PDF layout
    doc.fontSize(20).text(`Invoice #${invoice.id.slice(0, 8)}`, 50, 50);
    doc.fontSize(12).text(`Recipient: ${invoice.recipient}`, 50, 80);
    doc.text(`Email: ${invoice.email}`, 50, 100);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 120);
    doc.text(`Total: ${invoice.totalAmount.toFixed(2)} ${invoice.currency}`, 50, 140);
    if (invoice.paymentLink?.url) {
      doc.text(`Payment Link: ${invoice.paymentLink.url}`, 50, 160);
    }
    doc.moveDown();
    doc.text('Items:', 50, 180);
    invoice.lineItems.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.description}: ${item.amount.toFixed(2)}`, 50, 200 + index * 20);
    });

    doc.end();
    return null; // Return null since we're handling the response in the 'end' event
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
