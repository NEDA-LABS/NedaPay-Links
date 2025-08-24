import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

interface KYCResponse {
  kycStatus: KYCStatus;
  applicationId: string | null;
  reviewedAt: string | null;
}

export default function useSumsub() {
  const { user: privyUser } = usePrivy();
  const [kycStatus, setKycStatus] = useState<KYCStatus>('not_started');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    const checkKYC = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!privyUser?.wallet?.address) {
          setKycStatus('not_started');
          return;
        }

        // Call the API route instead of using Prisma directly
        const response = await fetch(
          `/api/sumsub?wallet=${encodeURIComponent(privyUser.wallet.address)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: KYCResponse = await response.json();
        
        setKycStatus(data.kycStatus);
        setApplicationId(data.applicationId);

      } catch (err) {
        setError(err as Error);
        console.error('KYC check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkKYC();
  }, [privyUser]);

  // Helper function to refresh KYC status
  const refreshKYCStatus = async () => {
    if (!privyUser?.wallet?.address) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/sumsub?wallet=${encodeURIComponent(privyUser.wallet.address)}`
      );
      
      if (response.ok) {
        const data: KYCResponse = await response.json();
        setKycStatus(data.kycStatus);
        setApplicationId(data.applicationId);
      }
    } catch (err) {
      console.error('Failed to refresh KYC status:', err);
    } finally {
      setLoading(false);
    }
  };

  return { 
    kycStatus, 
    loading, 
    error, 
    applicationId,
    refreshKYCStatus 
  };
}