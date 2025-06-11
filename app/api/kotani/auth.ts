// api/kotani/auth.js - Authentication helper
import axios from 'axios';

const KOTANI_API_BASE = process.env.KOTANI_API_BASE || 'https://sandbox-api.kotanipay.io/v3';
const KOTANI_USERNAME = process.env.KOTANI_USERNAME;
const KOTANI_PASSWORD = process.env.KOTANI_PASSWORD;

let authToken = null;
let tokenExpiry = null;

export async function getAuthToken() {
  // Check if token is still valid
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }

  try {
    const response = await axios.post(`${KOTANI_API_BASE}/authentication/login`, {
      username: KOTANI_USERNAME,
      password: KOTANI_PASSWORD
    });

    authToken = response.data.token;
    // Set expiry to 23 hours from now (tokens usually last 24 hours)
    tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
    
    return authToken;
  } catch (error) {
    console.error('Failed to authenticate with Kotani Pay:', error);
    throw new Error('Authentication failed');
  }
}








// .env.local (Environment variables template)
/*
KOTANI_API_BASE=https://sandbox-api.kotanipay.io/v3
KOTANI_USERNAME=your_kotani_username
KOTANI_PASSWORD=your_kotani_password
NEXTAUTH_URL=http://localhost:3000
*/