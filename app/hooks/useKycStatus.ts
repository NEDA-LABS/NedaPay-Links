import { useEffect, useState } from 'react';

interface KycStatus {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  details?: {
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    status?: string;
    createdAt?: Date;
  };
}

export function useKycStatus(walletAddress: string | null) {
  const [status, setStatus] = useState<KycStatus>({ status: 'NOT_STARTED' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setStatus({ status: 'NOT_STARTED' });
      setLoading(false);
      return;
    }

    const checkKycStatus = async () => {
      try {
        const response = await fetch(`/api/kyc/status?wallet=${walletAddress}`);
        if (!response.ok) {
          throw new Error('Failed to fetch KYC status');
        }
        const data = await response.json();
        setStatus({
          status: data.status,
          details: data.details,
        });
      } catch (err) {
        console.error('Error checking KYC status:', err);
        setError('Failed to check KYC status');
      } finally {
        setLoading(false);
      }
    };

    checkKycStatus();
  }, [walletAddress]);

  return { status, loading, error };
}
