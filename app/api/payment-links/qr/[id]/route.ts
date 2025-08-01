// app/api/payment-links/qr/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const link = await prisma.paymentLink.findUnique({ where: { linkId: id } });
  if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

  // If QR already generated → redirect
  if (link.qrCodeUrl) return NextResponse.redirect(link.qrCodeUrl, 302);

  // Generate PNG
  const qrDataURL = await QRCode.toDataURL(link.url, { width: 600, margin: 2 });
  // In production upload to Cloudinary / S3 → here we inline as base64 for demo
  const qrUrl = qrDataURL; // Replace with upload logic

  // Cache for next time
  await prisma.paymentLink.update({ where: { id: link.id }, data: { qrCodeUrl: qrUrl } });

  return new Response(Buffer.from(qrDataURL.split(',')[1], 'base64'), {
    headers: { 'Content-Type': 'image/png' },
  });
}