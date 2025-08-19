// hooks/useSumsubVerification.ts
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

export default function useSumsubVerification() {
  const { user: privyUser } = usePrivy();
  const [kycStatus, setKycStatus] = useState<KYCStatus>('not_started');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkKYC = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!privyUser?.wallet?.address) {
          setKycStatus('not_started');
          return;
        }

        const user = await prisma.user.findUnique({
          where: { wallet: privyUser.wallet.address },
          include: {
            sumsubApplications: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });

        if (!user || !user.sumsubApplications.length) {
          setKycStatus('not_started');
          return;
        }

        const latestApp = user.sumsubApplications[0];
        
        if (latestApp.reviewedAt) {
          if (latestApp.reviewAnswer === 'GREEN') {
            setKycStatus('approved');
          } else if (latestApp.reviewAnswer === 'RED') {
            setKycStatus('rejected');
          } else {
            setKycStatus('pending');
          }
        } else {
          setKycStatus('pending');
        }
      } catch (err) {
        setError(err as Error);
        console.error('KYC check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkKYC();
  }, [privyUser]);

  return { kycStatus, loading, error };
}