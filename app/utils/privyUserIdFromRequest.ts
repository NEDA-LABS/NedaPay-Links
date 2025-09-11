import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return null;
    }

    // For Privy integration, we need to decode the JWT token directly
    // Privy access tokens are JWTs that contain user information
    try {
      // Decode the JWT without verification first to see the structure
      const decoded = jwt.decode(token) as any;
      // console.log('Decoded token payload:', decoded); //debugging
      
      if (decoded && decoded.sub) {
        // The 'sub' (subject) field typically contains the user ID
        return decoded.sub;
      }
      
    } catch (jwtError) {
      console.log('JWT decode error:', jwtError);
    }
    
    console.log('Could not extract user ID from token');
    return null;
    
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return null;
  }
}