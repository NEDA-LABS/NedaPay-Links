// app/api/webhooks/sumsub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Environment variables you need to set
const SUMSUB_WEBHOOK_SECRET = process.env.SUMSUB_WEBHOOK_SECRET;

// TypeScript interfaces based on Sumsub documentation
interface ReviewResult {
  moderationComment?: string;
  clientComment?: string;
  reviewAnswer: 'GREEN' | 'RED' | 'YELLOW';
  rejectLabels?: string[];
  reviewRejectType?: 'FINAL' | 'RETRY';
  buttonIds?: string[];
}

interface ApplicantReviewedPayload {
  applicantId: string;
  inspectionId: string;
  correlationId: string;
  externalUserId: string;
  levelName: string;
  type: 'applicantReviewed';
  reviewResult: ReviewResult;
  reviewStatus: string;
  reviewMode?: 'ongoingAML' | 'ongoingDocExpired';
  createdAtMs: string;
  clientId?: string;
  sandboxMode?: boolean;
}

// Verify SHA-256 signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Remove 'sha256=' prefix if present
  const cleanSignature = signature.replace(/^sha256=/, '');
  
  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cleanSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Process applicantReviewed webhook
async function processApplicantReviewed(payload: ApplicantReviewedPayload) {
  console.log('Processing applicantReviewed webhook:', {
    applicantId: payload.applicantId,
    externalUserId: payload.externalUserId,
    reviewAnswer: payload.reviewResult.reviewAnswer,
    reviewStatus: payload.reviewStatus
  });

  // Handle different review answers
  switch (payload.reviewResult.reviewAnswer) {
    case 'GREEN':
      await handleApprovedApplicant(payload);
      break;
    case 'RED':
      await handleRejectedApplicant(payload);
      break;
    case 'YELLOW':
      await handlePendingApplicant(payload);
      break;
    default:
      console.warn('Unknown review answer:', payload.reviewResult.reviewAnswer);
  }
}

// Handle approved applicant
async function handleApprovedApplicant(payload: ApplicantReviewedPayload) {
  try {
    console.log(`Applicant ${payload.applicantId} approved`);
    
    // Your business logic here:
    // - Update user status in database
    // - Send approval email
    // - Enable user features
    // - Log the approval
    
    // Example database update (replace with your actual database logic)
    /*
    await db.user.update({
      where: { externalUserId: payload.externalUserId },
      data: { 
        kycStatus: 'approved',
        kycCompletedAt: new Date(payload.createdAtMs),
        sumsub: {
          applicantId: payload.applicantId,
          inspectionId: payload.inspectionId,
          reviewResult: payload.reviewResult
        }
      }
    });
    */
    
    // Example notification (replace with your notification service)
    /*
    await sendNotification({
      userId: payload.externalUserId,
      type: 'kyc_approved',
      message: 'Your identity verification has been approved!'
    });
    */
    
  } catch (error) {
    console.error('Error handling approved applicant:', error);
    throw error;
  }
}

// Handle rejected applicant
async function handleRejectedApplicant(payload: ApplicantReviewedPayload) {
  try {
    console.log(`Applicant ${payload.applicantId} rejected`);
    console.log('Reject labels:', payload.reviewResult.rejectLabels);
    console.log('Reject type:', payload.reviewResult.reviewRejectType);
    
    // Your business logic here:
    // - Update user status in database
    // - Send rejection email with reason
    // - Log rejection details
    // - Handle retry vs final rejection
    
    const isRetryAllowed = payload.reviewResult.reviewRejectType === 'RETRY';
    
    // Example database update
    /*
    await db.user.update({
      where: { externalUserId: payload.externalUserId },
      data: { 
        kycStatus: isRetryAllowed ? 'rejected_retry' : 'rejected_final',
        kycRejectedAt: new Date(payload.createdAtMs),
        kycRejectReason: payload.reviewResult.rejectLabels?.join(', '),
        sumsub: {
          applicantId: payload.applicantId,
          inspectionId: payload.inspectionId,
          reviewResult: payload.reviewResult
        }
      }
    });
    */
    
    // Example notification
    /*
    await sendNotification({
      userId: payload.externalUserId,
      type: 'kyc_rejected',
      message: isRetryAllowed 
        ? 'Your identity verification was rejected. Please try again with different documents.'
        : 'Your identity verification was rejected. Please contact support for assistance.',
      metadata: {
        rejectLabels: payload.reviewResult.rejectLabels,
        canRetry: isRetryAllowed
      }
    });
    */
    
  } catch (error) {
    console.error('Error handling rejected applicant:', error);
    throw error;
  }
}

// Handle pending applicant (manual review required)
async function handlePendingApplicant(payload: ApplicantReviewedPayload) {
  try {
    console.log(`Applicant ${payload.applicantId} requires manual review`);
    
    // Your business logic here:
    // - Update user status in database
    // - Send pending notification
    // - Alert admin team for manual review
    
    // Example database update
    /*
    await db.user.update({
      where: { externalUserId: payload.externalUserId },
      data: { 
        kycStatus: 'pending_manual_review',
        kycPendingAt: new Date(payload.createdAtMs),
        sumsub: {
          applicantId: payload.applicantId,
          inspectionId: payload.inspectionId,
          reviewResult: payload.reviewResult
        }
      }
    });
    */
    
  } catch (error) {
    console.error('Error handling pending applicant:', error);
    throw error;
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    // Read the raw body
    const body = await request.text();
    
    // Get signature from headers
    const signature = request.headers.get('x-signature');
    
    // Verify webhook secret is configured
    if (!SUMSUB_WEBHOOK_SECRET) {
      console.error('SUMSUB_WEBHOOK_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    
    // Verify signature
    if (!signature || !verifySignature(body, signature, SUMSUB_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse JSON payload
    let payload: ApplicantReviewedPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    // Verify this is an applicantReviewed webhook
    if (payload.type !== 'applicantReviewed') {
      console.log(`Received webhook type: ${payload.type}, ignoring`);
      return NextResponse.json({ message: 'Webhook type not handled' }, { status: 200 });
    }
    
    // Log webhook receipt
    console.log('Received applicantReviewed webhook:', {
      applicantId: payload.applicantId,
      externalUserId: payload.externalUserId,
      reviewAnswer: payload.reviewResult.reviewAnswer,
      correlationId: payload.correlationId,
      sandboxMode: payload.sandboxMode
    });
    
    // Process the webhook
    await processApplicantReviewed(payload);
    
    // Return success response
    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      correlationId: payload.correlationId
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Handle GET requests for webhook endpoint verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Sumsub webhook endpoint is active',
    supportedEvents: ['applicantReviewed'],
    timestamp: new Date().toISOString()
  });
}