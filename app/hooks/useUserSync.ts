import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import toast from 'react-hot-toast';

export function useUserSync() {
  const { user, authenticated, ready } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  type User = {
    email?: string | null;
    wallet?: string | null;
    [key: string]: any; // Allow for other properties
  };

  const [userData, setUserData] = useState<User | null>(null);

  // Sync user when they authenticate
  useEffect(() => {
    if (!ready || !authenticated || !user || isLoading) return;

    const syncUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ privyUser: user }),
        });

        // if (!response.ok) {
        //   throw new Error('Failed to sync user');
        // }

        const result = await response.json();
        setUserData(result.user);
        
        // Store user data in localStorage for quick access
        localStorage.setItem('userData', JSON.stringify(result.user));
        
        // console.log('User synced successfully:', result.user); 
      } catch (error) {
        // console.log('privy user:', user);
        // console.error('Error syncing user:', error);
        toast.error('Failed to sync user data');

      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [ready, authenticated, user]);

  // Function to add email to user
  const addEmail = async (email: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/add-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          privyUserId: user.id, 
          email 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add email');
      }

      const result = await response.json();
      setUserData(result.user);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      toast.success('Email added successfully!');
      return result.user;
    } catch (error) {
      // console.error('Error adding email:', error);
      toast.error('Failed to add email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // console.log("user email", userData?.email);

  return {
    userData,
    isLoading,
    addEmail,
    hasEmail: userData?.email != null,
    hasWallet: userData?.wallet != null,
  };
}