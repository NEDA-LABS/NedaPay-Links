import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import InviteClient from './InviteClient';

const prisma = new PrismaClient();

export default async function InvitePage({ params }: { params: { code: string } }) {
  const profile = await prisma.influencerProfile.findUnique({
    where: { customCode: params.code.toUpperCase() },
    include: { user: true }, // to read displayName
  });

  if (!profile || !profile.isActive || !profile.user.isActive) notFound();

  return (
    <InviteClient
      influencer={{
        code: profile.customCode,
        name: profile.displayName,
        email: profile.user.email || '',
        bonus: `10 tokens`, // or any dynamic value you store in DB later
      }}
    />
  );
}