import { createSignature, nowMillis } from "../../utils/idrxco/signature";

export function idrxHeaders(method: string, url: string, body?: any) {
  console.log('🔐 Creating IDRX headers...');
  console.log('📝 Method:', method);
  console.log('🔗 URL:', url);
  console.log('📦 Body:', body);
  
  const timestamp = nowMillis();
  console.log('⏰ Timestamp:', timestamp);
  
  const apiKey = process.env.IDRXCO_API_KEY;
  const secretKey = process.env.IDRXCO_SECRET_KEY;
  
  console.log('🔑 API Key exists:', !!apiKey);
  console.log('🔑 Secret Key exists:', !!secretKey);
  console.log('🔑 API Key (first 10 chars):', apiKey?.substring(0, 10) + '...');
  
  if (!apiKey || !secretKey) {
    console.error('❌ Missing IDRXCO credentials!');
    throw new Error('Missing IDRXCO_API_KEY or IDRXCO_SECRET_KEY environment variables');
  }
  
  const sig = createSignature(
    method,
    url,
    body ?? "",
    timestamp,
    secretKey
  );
  
  console.log('✍️ Generated signature:', sig);
  
  const headers = {
    "idrx-api-key": apiKey,
    "idrx-api-sig": sig,
    "idrx-api-ts": timestamp,
  };
  
  console.log('📋 Final headers:', headers);
  
  return {
    timestamp,
    headers,
  };
}

export const IDRX_BASE = "https://idrx.co";
