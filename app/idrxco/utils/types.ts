// app/types/idrx.ts
export interface User {
    id: number;
    fullname: string;
    email: string;
    createdAt: string;
    apiKey: string;
    apiSecret: string;
  }
  
  export interface BankAccount {
    id: number;
    userId: number;
    bankAccountNumber: string;
    bankAccountName: string;
    bankCode: string;
    bankName: string;
    maxAmountTransfer: string;
    deleted: boolean;
    DepositWalletAddress: {
      walletAddress: string;
      createdAt: string;
    };
  }
  
  export interface RedeemRequest {
    txHash: string;
    networkChainId: string;
    amountTransfer: string;
    bankAccount: string;
    bankCode: string;
    bankName: string;
    bankAccountName: string;
    walletAddress: string;
  }
  
  export interface Transaction {
    id: number;
    chainId: number;
    userId: number;
    requester: string;
    txHash: string;
    fromAddress: string;
    amount: string;
    bankName: string;
    bankCode: string;
    bankAccountNumber: string;
    bankAccountName: string;
    custRefNumber: string;
    disburseId: number;
    burnStatus: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface BankCode {
    code: string;
    name: string;
  }

  // Methods returned by GET https://idrx.co/api/transaction/method
  export interface BankMethod {
    bankCode: string;
    bankName: string;
    maxAmountTransfer: string;
  }