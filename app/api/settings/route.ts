import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Extract user ID from authentication
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with settings and API keys
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchantSettings: true,
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            keyId: true,
            environment: true,
            name: true,
            lastUsed: true,
            createdAt: true,
            // Don't return the actual hashed key
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no settings exist, create default ones
    let settings = user.merchantSettings;
    if (!settings) {
      settings = await prisma.merchantSettings.create({
        data: {
          userId: userId,
          businessName: '',
          businessEmail: user.email || '',
          businessPhone: '',
          businessCategory: 'retail',
          businessDescription: '',
        }
      });
    }

    return NextResponse.json({
      settings: {
        businessName: settings.businessName,
        businessEmail: settings.businessEmail,
        businessPhone: settings.businessPhone,
        businessCategory: settings.businessCategory,
        businessDescription: settings.businessDescription,
        autoSettlement: settings.autoSettlement,
        settlementThreshold: settings.settlementThreshold,
        settlementCurrency: settings.settlementCurrency,
        paymentExpiry: settings.paymentExpiry,
        twoFactorEnabled: settings.twoFactorEnabled,
        withdrawalConfirmation: settings.withdrawalConfirmation,
        transactionNotifications: settings.transactionNotifications,
        settlementNotifications: settings.settlementNotifications,
        securityAlerts: settings.securityAlerts,
        marketingUpdates: settings.marketingUpdates,
        webhookUrl: settings.webhookUrl,
      },
      apiKeys: user.apiKeys
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  try {
    // Extract user ID from authentication
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessCategory,
      businessDescription,
      autoSettlement,
      settlementThreshold,
      settlementCurrency,
      paymentExpiry,
      twoFactorEnabled,
      withdrawalConfirmation,
      transactionNotifications,
      settlementNotifications,
      securityAlerts,
      marketingUpdates,
      webhookUrl,
    } = body;

    // Validate required fields
    if (!businessName || !businessEmail) {
      return NextResponse.json({ error: 'Business name and email are required' }, { status: 400 });
    }

    // Validate business category
    const validCategories = ['retail', 'food', 'services', 'technology', 'education', 'other'];
    if (businessCategory && !validCategories.includes(businessCategory)) {
      return NextResponse.json({ error: 'Invalid business category' }, { status: 400 });
    }

    // Validate settlement threshold
    if (settlementThreshold && (isNaN(settlementThreshold) || settlementThreshold < 0)) {
      return NextResponse.json({ error: 'Invalid settlement threshold' }, { status: 400 });
    }

    // Validate payment expiry
    if (paymentExpiry && (isNaN(paymentExpiry) || paymentExpiry < 1 || paymentExpiry > 1440)) {
      return NextResponse.json({ error: 'Payment expiry must be between 1 and 1440 minutes' }, { status: 400 });
    }

    // Update or create settings
    const settings = await prisma.merchantSettings.upsert({
      where: { userId },
      update: {
        businessName,
        businessEmail,
        businessPhone,
        businessCategory,
        businessDescription,
        autoSettlement: autoSettlement ?? undefined,
        settlementThreshold: settlementThreshold ? parseFloat(settlementThreshold) : undefined,
        settlementCurrency,
        paymentExpiry: paymentExpiry ? parseInt(paymentExpiry) : undefined,
        twoFactorEnabled: twoFactorEnabled ?? undefined,
        withdrawalConfirmation: withdrawalConfirmation ?? undefined,
        transactionNotifications: transactionNotifications ?? undefined,
        settlementNotifications: settlementNotifications ?? undefined,
        securityAlerts: securityAlerts ?? undefined,
        marketingUpdates: marketingUpdates ?? undefined,
        webhookUrl,
        updatedAt: new Date(),
      },
      create: {
        userId,
        businessName,
        businessEmail,
        businessPhone,
        businessCategory,
        businessDescription,
        autoSettlement: autoSettlement ?? true,
        settlementThreshold: settlementThreshold ? parseFloat(settlementThreshold) : 1000,
        settlementCurrency: settlementCurrency || 'TSHC',
        paymentExpiry: paymentExpiry ? parseInt(paymentExpiry) : 60,
        twoFactorEnabled: twoFactorEnabled ?? false,
        withdrawalConfirmation: withdrawalConfirmation ?? true,
        transactionNotifications: transactionNotifications ?? true,
        settlementNotifications: settlementNotifications ?? true,
        securityAlerts: securityAlerts ?? true,
        marketingUpdates: marketingUpdates ?? false,
        webhookUrl,
      }
    });

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: {
        businessName: settings.businessName,
        businessEmail: settings.businessEmail,
        businessPhone: settings.businessPhone,
        businessCategory: settings.businessCategory,
        businessDescription: settings.businessDescription,
        autoSettlement: settings.autoSettlement,
        settlementThreshold: settings.settlementThreshold,
        settlementCurrency: settings.settlementCurrency,
        paymentExpiry: settings.paymentExpiry,
        twoFactorEnabled: settings.twoFactorEnabled,
        withdrawalConfirmation: settings.withdrawalConfirmation,
        transactionNotifications: settings.transactionNotifications,
        settlementNotifications: settings.settlementNotifications,
        securityAlerts: settings.securityAlerts,
        marketingUpdates: settings.marketingUpdates,
        webhookUrl: settings.webhookUrl,
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to extract user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Example implementation for JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;
    
    // Verify and decode your JWT token here
    // For Privy integration, you might verify the Privy access token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // return decoded.userId;
    
    // Placeholder - replace with your actual auth logic
    return 'user-id-from-token';
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return null;
  }
}