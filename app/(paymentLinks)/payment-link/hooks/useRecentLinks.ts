import { useState, useEffect } from "react";
import { PaymentLink } from "../types";

export const useRecentLinks = (getMerchantAddress: () => string, isConnected: boolean) => {
  const [recentLinks, setRecentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      const merchantAddress = getMerchantAddress();
      if (!merchantAddress) {
        setRecentLinks([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/payment-links?merchantId=${merchantAddress}`);
        
        if (response.ok) {
          const links = await response.json();
          setRecentLinks(
            links.map((link: any) => ({
              id: link.id,
              createdAt: new Date(link.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              amount: link.amount,
              currency: link.currency,
              status: link.status,
              url: link.url,
              description: link.description,
              expiresAt: new Date(link.expiresAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              linkId: link.linkId,
              linkType: link.linkType || "NORMAL",
              chainId: link.chainId,
            }))
          );
        } else {
          setRecentLinks([]);
        }
      } catch (error) {
        console.error("Error fetching payment links:", error);
        setRecentLinks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [getMerchantAddress, isConnected]);

  return { recentLinks, isLoading, setRecentLinks };
};