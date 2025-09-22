import { PaymentLinkFormData } from "../types/index";

export const validatePaymentLinkForm = (formData: PaymentLinkFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Amount validation
  if (formData.linkType === "NORMAL" && formData.amount) {
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount)) {
      errors.push("Amount must be a valid number");
    }
    if (parsedAmount < 0) {
      errors.push("Amount cannot be negative");
    }
    if (parsedAmount > 0 && !formData.specifyCurrency) {
      errors.push("Please specify a currency when setting an amount");
    }
  }

  if (formData.linkType === "OFF_RAMP") {
    if (!formData.amount) {
      errors.push("Amount is required for off-ramp links");
    } else {
      const parsedAmount = parseFloat(formData.amount);
      if (isNaN(parsedAmount)) {
        errors.push("Amount must be a valid number");
      }
      if (parsedAmount <= 0) {
        errors.push("Amount must be greater than 0 for off-ramp links");
      }
    }
  }

  // Description validation
  if (formData.description.length > 1000) {
    errors.push("Description cannot exceed 1000 characters");
  }
  if (!/^[a-zA-Z0-9\s.,!?-]*$/.test(formData.description)) {
    errors.push("Description contains invalid characters");
  }

  // Off-ramp specific validation
  if (formData.linkType === "OFF_RAMP") {
    if (!formData.offRampValue) {
      errors.push("Off-ramp value (phone/bank account) is required");
    }
    if (!formData.offRampProvider) {
      errors.push("Off-ramp provider is required");
    }
    if (formData.offRampType === "BANK_ACCOUNT" && !formData.accountName) {
      errors.push("Account name is required for bank account off-ramp");
    }
  }

  // Expiration validation
  if (formData.expirationEnabled && formData.expiresAt) {
    const expirationDate = new Date(formData.expiresAt);
    if (expirationDate <= new Date()) {
      errors.push("Expiration date must be in the future");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>{}]/g, "").substring(0, 1000);
};

export const validateAmount = (amount: string): boolean => {
  if (!amount) return true; // Empty amount is valid for normal links
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed >= 0;
};