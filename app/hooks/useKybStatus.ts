import { useEffect, useState } from 'react';

interface KybStatus {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  details?: {
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    status?: string;
    createdAt?: Date;
  };
}

export function useKybStatus(walletAddress: string | null) {
  const [status, setStatus] = useState<KybStatus>({ status: 'NOT_STARTED' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setStatus({ status: 'NOT_STARTED' });
      setLoading(false);
      return;
    }

    const checkKybStatus = async () => {
      try {
        const response = await fetch(`/api/kyb/status?wallet=${walletAddress}`);
        if (!response.ok) {
          throw new Error('Failed to fetch KYB status');
        }
        const data = await response.json();
        setStatus({
          status: data.status,
          details: data.details,
        });
      } catch (err) {
        console.error('Error checking KYB status:', err);
        setError('Failed to check KYB status');
      } finally {
        setLoading(false);
      }
    };

    checkKybStatus();
  }, [walletAddress]);

  return {
    status,
    loading,
    error
  };
}
