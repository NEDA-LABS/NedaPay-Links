import { useState, useEffect, useCallback } from "react";
import crypto from 'crypto';
import { usePrivy } from "@privy-io/react-auth";
import { PaymentLinkFormData, PaymentLink, Institution } from "../types";
import { fetchSupportedCurrencies, fetchSupportedInstitutions } from "@/utils/paycrest";
import { stablecoins } from "@/data/stablecoins";
import { SUPPORTED_CHAINS } from "../utils/chains";

export const usePaymentLink = () => {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const isConnected = authenticated && !!walletAddress;

  const [formData, setFormData] = useState<PaymentLinkFormData>({
    amount: "",
    currency: "USDC",
    description: "",
    linkType: "NORMAL",
    offRampType: "PHONE",
    offRampValue: "",
    accountName: "",
    offRampProvider: "",
    chainId: 8453,
    expiresAt: "",
    expirationEnabled: false,
    specifyChain: true,
    specifyCurrency: true,
  });

  const [supportedInstitutions, setSupportedInstitutions] = useState<Institution[]>([]);
  const [supportedCurrencies, setSupportedCurrencies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getMerchantAddress = useCallback((): string => {
    if (walletAddress && walletAddress.length > 10) return walletAddress;
    if (typeof window !== "undefined") {
      const lsAddr = localStorage.getItem("walletAddress");
      if (lsAddr && lsAddr.length > 10) return lsAddr;
    }
    return "";
  }, [walletAddress]);

  // Fetch currencies when link type changes
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        if (formData.linkType === "OFF_RAMP") {
          const currencies = await fetchSupportedCurrencies();
          setSupportedCurrencies(currencies);
          if (currencies.length > 0) {
            setFormData(prev => ({ ...prev, currency: currencies[0].code }));
          }
        } else {
          setSupportedCurrencies(stablecoins);
          setFormData(prev => ({ ...prev, currency: "USDC" }));
        }
      } catch (error) {
        console.error("Error fetching supported currencies:", error);
      }
    };
    fetchCurrencies();
  }, [formData.linkType]);

  // Fetch institutions when currency changes for off-ramp
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        if (formData.linkType === "OFF_RAMP") {
          const institutions = await fetchSupportedInstitutions(formData.currency);
          setSupportedInstitutions(institutions);
          setFormData(prev => ({ ...prev, offRampProvider: "" }));
        }
      } catch (error) {
        console.error("Error fetching supported institutions:", error);
      }
    };
    fetchInstitutions();
  }, [formData.currency, formData.linkType]);

  const updateFormData = useCallback((updates: Partial<PaymentLinkFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>{}]/g, "").substring(0, 1000);
  };

  const validateInput = (): boolean => {
    // Validation logic from your original component
    if (formData.linkType === "NORMAL" && formData.amount) {
      const parsedAmount = parseFloat(formData.amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) return false;
      if (!formData.specifyCurrency) {
        alert("Please specify a currency when setting an amount");
        return false;
      }
    }

    if (formData.linkType === "OFF_RAMP") {
      if (!formData.amount) return false;
      const parsedAmount = parseFloat(formData.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) return false;
      if (!formData.offRampValue || !formData.offRampProvider) return false;
      if (formData.offRampType === "BANK_ACCOUNT" && !formData.accountName) return false;
    }

    if (formData.expirationEnabled) {
      if (!formData.expiresAt) {
        alert("Please select an expiration date.");
        return false;
      }
      console.log("Debug - expiresAt value:", formData.expiresAt);
      const expires = new Date(formData.expiresAt);
      console.log("Debug - parsed date:", expires);
      console.log("Debug - is valid date:", !isNaN(expires.getTime()));
      console.log("Debug - is future date:", expires > new Date());
      if (isNaN(expires.getTime()) || expires <= new Date()) {
        alert(`Please select a valid future date for expiration. Current value: ${formData.expiresAt}`);
        return false;
      }
    }

    return true;
  };

  const createLink = async (formData: PaymentLinkFormData): Promise<PaymentLink | null> => {
    const merchantId = getMerchantAddress();
    if (!merchantId) {
      console.error("Merchant address not available");
      return null;
    }

    const linkId = crypto.randomBytes(8).toString('hex');
    const status = 'Active';
    
    let expiresAtDate;
    if (formData.expirationEnabled && formData.expiresAt) {
      expiresAtDate = new Date(formData.expiresAt);
    } else {
      expiresAtDate = new Date();
      expiresAtDate.setDate(expiresAtDate.getDate() + 30); // Default 30 days expiration
    }

    const payload = {
      ...formData,
      merchantId,
      linkId,
      status,
      expiresAt: expiresAtDate.toISOString(),
    };
    try {
      const response = await fetch('/api/payment-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment link');
      }

      const newLink: PaymentLink = await response.json();
      return newLink;
    } catch (error) {
      console.error("Error creating payment link:", error);
      return null;
    }
  };

  return {
    formData,
    updateFormData,
    supportedInstitutions,
    supportedCurrencies,
    isLoading,
    setIsLoading,
    isConnected,
    getMerchantAddress,
    sanitizeInput,
    validateInput,
    walletAddress,
    createLink,
  };
};