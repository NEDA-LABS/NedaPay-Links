import { NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

// Environment variables - replace with your actual Sumsub credentials
const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN!;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY!;
const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';

interface AccessTokenRequest {
  userId: string;
  levelName: string;
  email?: string;
  phone?: string;
  ttlInSecs?: number;
}

interface SumsubResponse {
  token: string;
  userId: string;
}

console.log(SUMSUB_APP_TOKEN, SUMSUB_SECRET_KEY, SUMSUB_BASE_URL);

// Function to create HMAC signature for Sumsub API
function createSignature(
  method: string,
  url: string,
  body: string,
  timestamp: number
): string {
  const payload = timestamp + method.toUpperCase() + url + body;
  return crypto
    .createHmac('sha256', SUMSUB_SECRET_KEY)
    .update(payload)
    .digest('hex');
}

// Function to generate access token
async function generateAccessToken(requestData: AccessTokenRequest): Promise<SumsubResponse> {
  const url = '/resources/accessTokens/sdk';
  const method = 'POST';
  const timestamp = Math.floor(Date.now() / 1000);
  
  const requestBody = {
    applicantIdentifiers: {
      ...(requestData.email && { email: requestData.email }),
      ...(requestData.phone && { phone: requestData.phone })
    },
    ttlInSecs: requestData.ttlInSecs || 600, // 10 minutes default
    userId: requestData.userId,
    levelName: requestData.levelName
  };

  const bodyString = JSON.stringify(requestBody);
  const signature = createSignature(method, url, bodyString, timestamp);

  const headers = {
    'Content-Type': 'application/json',
    'X-App-Token': SUMSUB_APP_TOKEN,
    'X-App-Access-Sig': signature,
    'X-App-Access-Ts': timestamp.toString()
  };

  try {
    const response = await axios.post(
      `${SUMSUB_BASE_URL}${url}`,
      requestBody,
      { headers }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Error generating access token:', error.response?.data || error.message);
    throw new Error('Failed to generate access token');
  }
}

export async function POST(req: Request) {
  try {
    const { userId, levelName, email, phone, ttlInSecs } = await req.json();

    // Validate required fields
    if (!userId || !levelName) {
      return NextResponse.json({
        error: 'Missing required fields: userId and levelName are required'
      }, { status: 400 });
    }

    // URL encode special characters in userId and levelName
    const encodedUserId = encodeURIComponent(userId);
    const encodedLevelName = encodeURIComponent(levelName);

    const tokenData = await generateAccessToken({
      userId: encodedUserId,
      levelName: encodedLevelName,
      email,
      phone,
      ttlInSecs
    });

    return NextResponse.json({
      success: true,
      data: tokenData
    });

  } catch (error: any) {
    console.error('Access token generation failed:', error);
    return NextResponse.json({
      error: 'Failed to generate access token',
      message: error.message
    }, { status: 500 });
  }
}

// Optional: Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
}