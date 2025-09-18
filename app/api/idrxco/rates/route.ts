import { NextResponse } from "next/server";
import { idrxHeaders, IDRX_BASE } from "../_core";

export async function GET(request: Request) {
  console.log('🔄 Rates API called');
  
  try {
    const { searchParams } = new URL(request.url);
    console.log('📥 Incoming search params:', Object.fromEntries(searchParams.entries()));
    
    const chainId = searchParams.get('chainId');
    const token = searchParams.get('token');
    const amount = searchParams.get('amount');
    
    console.log('🔍 Parsed params:', { chainId, token, amount });

    // Build query parameters for the IDRX API according to documentation
    const params = new URLSearchParams();
    
    // Default chainId to 137 (Polygon) if not specified
    const finalChainId = chainId || '137';
    params.append('chainId', finalChainId);
    
    // Handle IDRX 1:1 peg with IDR - no need to call external API
    if (token && token.toUpperCase() === 'IDRX') {
      console.log('💰 IDRX detected - returning 1:1 rate with IDR');
      const idrxAmount = amount ? parseFloat(amount) : 1;
      const mockResponse = {
        statusCode: 200,
        message: 'success',
        data: {
          price: '1.0', // 1:1 peg
          buyAmount: idrxAmount.toString(),
          chainId: parseInt(finalChainId)
        }
      };
      console.log('✅ Returning IDRX mock response:', mockResponse);
      return NextResponse.json(mockResponse, { status: 200 });
    }

    // Map token and amount to the correct IDRX API parameters for other tokens
    if (token && amount) {
      if (token.toUpperCase() === 'USDT' || token.toUpperCase() === 'USDC') {
        params.append('usdtAmount', amount);
        console.log('💰 Using usdtAmount:', amount);
      } else {
        // For other tokens, default to usdtAmount
        params.append('usdtAmount', amount);
        console.log('💰 Defaulting to usdtAmount for token:', token);
      }
    } else if (amount) {
      // If no token specified, default to usdtAmount
      params.append('usdtAmount', amount);
      console.log('💰 No token specified, using usdtAmount:', amount);
    }

    const path = `/api/transaction/rates${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('🌐 IDRX API path:', path);
    console.log('🔗 Full URL:', `${IDRX_BASE}${path}`);
    
    const { headers } = idrxHeaders("GET", `${IDRX_BASE}${path}`, "");
    console.log('📋 Request headers:', headers);
    
    console.log('🚀 Making request to IDRX API...');
    const r = await fetch(`${IDRX_BASE}${path}`, { 
      headers: { ...headers },
      method: 'GET'
    });
    
    console.log('📊 IDRX API response status:', r.status);
    console.log('📊 IDRX API response headers:', Object.fromEntries(r.headers.entries()));
    
    const responseText = await r.text();
    console.log('📄 Raw response text:', responseText);
    
    let j;
    try {
      j = JSON.parse(responseText);
      console.log('✅ Parsed JSON response:', j);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('📄 Response text that failed to parse:', responseText);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    console.log('✅ Returning response with status:', r.status);
    return NextResponse.json(j, { status: r.status });
  } catch (error) {
    console.error('❌ Rates API error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        statusCode: 500, 
        message: 'Failed to fetch rates', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
