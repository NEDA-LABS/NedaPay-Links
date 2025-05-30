import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import { getUserIdFromRequest } from '../route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


// pages/api/settings/api-keys.ts
export async function handleApiKeys(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    switch (method) {
      case 'POST':
        return generateApiKey(req, res, userId);
      case 'DELETE':
        return revokeApiKey(req, res, userId);
      default:
        res.setHeader('Allow', ['POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  }
  
  async function generateApiKey(req: NextApiRequest, res: NextApiResponse, userId: string) {
    try {
      const { environment, name } = req.body;
      
      if (!environment || !['live', 'test'].includes(environment)) {
        return res.status(400).json({ error: 'Invalid environment. Must be "live" or "test"' });
      }
  
      // Generate API key
      const apiKey = `sk_${environment}_${crypto.randomBytes(32).toString('hex')}`;
      const keyId = `key_${crypto.randomBytes(16).toString('hex')}`;
      const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  
      // Store in database
      const createdKey = await prisma.apiKey.create({
        data: {
          userId,
          keyId,
          hashedKey,
          environment,
          name: name || `${environment} API Key`,
        }
      });
  
      return res.status(201).json({
        message: 'API key generated successfully',
        apiKey, // Only return the actual key once, during creation
        keyId: createdKey.keyId,
        environment: createdKey.environment,
        name: createdKey.name,
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async function revokeApiKey(req: NextApiRequest, res: NextApiResponse, userId: string) {
    try {
      const { keyId } = req.body;
      
      if (!keyId) {
        return res.status(400).json({ error: 'Key ID is required' });
      }
  
      // Update API key to inactive
      const updatedKey = await prisma.apiKey.updateMany({
        where: {
          keyId,
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        }
      });
  
      if (updatedKey.count === 0) {
        return res.status(404).json({ error: 'API key not found or already revoked' });
      }
  
      return res.status(200).json({ message: 'API key revoked successfully' });
    } catch (error) {
      console.error('Error revoking API key:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // pages/api/settings/2fa.ts
  export async function handle2FA(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    switch (method) {
      case 'POST':
        return setup2FA(req, res, userId);
      case 'PUT':
        return verify2FA(req, res, userId);
      case 'DELETE':
        return disable2FA(req, res, userId);
      default:
        res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  }
  
  async function setup2FA(req: NextApiRequest, res: NextApiResponse, userId: string) {
    try {
      // Generate secret for TOTP
      const secret = speakeasy.generateSecret({
        name: 'NEDA Pay',
        issuer: userId,
        length: 32,
      });
  
      // Store encrypted secret temporarily (not enabled until verified)
      await prisma.merchantSettings.upsert({
        where: { userId },
        update: {
          twoFactorSecret: secret.base32, // In production, encrypt this
          updatedAt: new Date(),
        },
        create: {
          userId,
          twoFactorSecret: secret.base32,
        }
      });
  
      return res.status(200).json({
        secret: secret.base32,
        qrCode: secret.otpauth_url,
      });
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async function verify2FA(req: NextApiRequest, res: NextApiResponse, userId: string) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
  
      const settings = await prisma.merchantSettings.findUnique({
        where: { userId }
      });
  
      if (!settings?.twoFactorSecret) {
        return res.status(400).json({ error: '2FA setup not initiated' });
      }
  
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: settings.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps of tolerance
      });
  
      if (!verified) {
        return res.status(400).json({ error: 'Invalid token' });
      }
  
      // Enable 2FA
      await prisma.merchantSettings.update({
        where: { userId },
        data: {
          twoFactorEnabled: true,
          updatedAt: new Date(),
        }
      });
  
      return res.status(200).json({ message: '2FA enabled successfully' });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async function disable2FA(req: NextApiRequest, res: NextApiResponse, userId: string) {
    try {
      const { token } = req.body;
      
      const settings = await prisma.merchantSettings.findUnique({
        where: { userId }
      });
  
      if (!settings?.twoFactorEnabled || !settings.twoFactorSecret) {
        return res.status(400).json({ error: '2FA is not enabled' });
      }
  
      // Verify token before disabling
      const verified = speakeasy.totp.verify({
        secret: settings.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2,
      });
  
      if (!verified) {
        return res.status(400).json({ error: 'Invalid token' });
      }
  
      // Disable 2FA
      await prisma.merchantSettings.update({
        where: { userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          updatedAt: new Date(),
        }
      });
  
      return res.status(200).json({ message: '2FA disabled successfully' });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }