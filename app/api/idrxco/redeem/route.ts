import { NextRequest, NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";

interface RedeemRequest {
  amount: string;
  bankAccount: string;
  bankCode: string;
  bankName: string;
  walletAddress: string;
  txHash: string;
  chainId: number;
  chainName: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RedeemRequest = await req.json();
    
    // Validate required fields
    const requiredFields = ['amount', 'bankAccount', 'bankCode', 'bankName', 'walletAddress', 'txHash'];
    for (const field of requiredFields) {
      if (!body[field as keyof RedeemRequest]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create bank account hash for IDRX backend
    const bankAccountHash = `${body.bankName}_${body.bankAccount}`;
    
    // Prepare payload for IDRX backend
    const idrxPayload = {
      amount: Number(body.amount), // Convert to number for IDRX backend
      bankAccountHash,
      burnTxHash: body.txHash,
      walletAddress: body.walletAddress,
      chainId: body.chainId,
      chainName: body.chainName,
    };

    const path = "/api/transaction/redeem-request";
    const { headers } = idrxHeaders("POST", `${IDRX_BASE}${path}`, idrxPayload);
    
    const response = await fetch(`${IDRX_BASE}${path}`, {
      method: "POST",
      headers: { 
        ...headers, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(idrxPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('IDRX backend error:', result);
      return NextResponse.json(
        { 
          error: result.message || 'Failed to process redemption request',
          details: result 
        },
        { status: response.status }
      );
    }

    // Log successful redemption for monitoring
    console.log('Redemption request processed:', {
      amount: body.amount,
      walletAddress: body.walletAddress,
      txHash: body.txHash,
      chainId: body.chainId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Redemption request submitted successfully',
      data: result,
      txHash: body.txHash,
    });

  } catch (error) {
    console.error('Redemption API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
