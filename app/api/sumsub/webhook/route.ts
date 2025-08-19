import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

// Environment variables you need to set
const SUMSUB_WEBHOOK_SECRET = process.env.SUMSUB_WEBHOOK_SECRET;

// TypeScript interfaces based on Sumsub documentation
interface ReviewResult {
  moderationComment?: string;
  clientComment?: string;
  reviewAnswer: "GREEN" | "RED" | "YELLOW";
  rejectLabels?: string[];
  reviewRejectType?: "FINAL" | "RETRY";
  buttonIds?: string[];
}

interface ApplicantReviewedPayload {
  applicantId: string;
  inspectionId: string;
  correlationId: string;
  externalUserId: string;
  levelName: string;
  type: "applicantReviewed";
  reviewResult: ReviewResult;
  reviewStatus: string;
  reviewMode?: "ongoingAML" | "ongoingDocExpired";
  createdAtMs: string;
  clientId?: string;
  sandboxMode?: boolean;
}

// Verify signature using Sumsub's expected format
function verifySignature(
  payload: string,
  digestHeader: string,
  algorithmHeader: string,
  secret: string
): boolean {
  if (!digestHeader || !algorithmHeader || !secret) {
    console.error("Missing required headers or secret:", {
      hasDigest: !!digestHeader,
      hasAlgorithm: !!algorithmHeader,
      hasSecret: !!secret,
    });
    return false;
  }

  // Mapping Sumsub algorithm names to Node.js crypto algorithm names
  const algorithmMap: Record<string, string> = {
    HMAC_SHA1_HEX: "sha1",
    HMAC_SHA256_HEX: "sha256",
    HMAC_SHA512_HEX: "sha512",
  };

  const algorithm = algorithmMap[algorithmHeader];
  if (!algorithm) {
    console.error("Unsupported algorithm:", algorithmHeader);
    return false;
  }

  try {
    // Expected digest
    const calculatedDigest = crypto
      .createHmac(algorithm, secret)
      .update(payload, "utf8")
      .digest("hex");

    console.log("Signature verification:", {
      algorithm: algorithmHeader,
      expectedDigest: calculatedDigest,
      receivedDigest: digestHeader,
      payloadLength: payload.length,
    });

    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(digestHeader, "hex"),
      Buffer.from(calculatedDigest, "hex")
    );
  } catch (error) {
    console.error("Error during signature verification:", error);
    return false;
  }
}

// Store webhook event 
async function storeWebhookEvent(
  payload: ApplicantReviewedPayload,
  sumsubApplicationId: string
) {
  try {
    // Check if we've already processed this webhook (idempotency check)
    const existingEvent = await prisma.sumsubWebhookEvent.findUnique({
      where: { correlationId: payload.correlationId },
    });

    if (existingEvent) {
      console.log(
        `Webhook ${payload.correlationId} already processed, skipping`
      );
      return existingEvent;
    }

    // Store the webhook event
    const webhookEvent = await prisma.sumsubWebhookEvent.create({
      data: {
        sumsubApplicationId,
        correlationId: payload.correlationId,
        eventType: "APPLICANT_REVIEWED",
        payload: payload as any, // Store full payload as JSON
        processed: false,
      },
    });

    return webhookEvent;
  } catch (error) {
    console.error("Error storing webhook event:", error);
    throw error;
  }
}

// Find or create Sumsub application record
async function findOrCreateSumsubApplication(
  payload: ApplicantReviewedPayload
) {
  try {
    // First, try to find existing application
    let sumsubApplication = await prisma.sumsubApplication.findUnique({
      where: { applicantId: payload.applicantId },
    });

    if (sumsubApplication) {
      return sumsubApplication;
    }

    // If not found, we need to find the user by externalUserId (which should be your user ID)
    const user = await prisma.user.findFirst({
      where: {
        privyUserId: decodeURIComponent(payload.externalUserId),
      },
    });

    if (!user) {
      throw new Error(
        `User not found for externalUserId: ${payload.externalUserId}`
      );
    }

    // Create new Sumsub application record
    sumsubApplication = await prisma.sumsubApplication.create({
      data: {
        userId: user.id,
        applicantId: payload.applicantId,
        inspectionId: payload.inspectionId,
        externalUserId: payload.externalUserId,
        levelName: payload.levelName,
        verificationStatus: "COMPLETED", // Since we're getting a review result
        reviewAnswer: payload.reviewResult.reviewAnswer as any,
        reviewRejectType: payload.reviewResult.reviewRejectType as any,
        sandboxMode: payload.sandboxMode || false,
        submittedAt: new Date(), // We don't have exact submission time, use now
        reviewedAt: new Date(parseInt(payload.createdAtMs)),
      },
    });

    return sumsubApplication;
  } catch (error) {
    console.error("Error finding/creating Sumsub application:", error);
    throw error;
  }
}

// Update Sumsub application with review results
async function updateSumsubApplicationWithReview(
  sumsubApplication: any,
  payload: ApplicantReviewedPayload
) {
  try {
    const updatedApplication = await prisma.sumsubApplication.update({
      where: { id: sumsubApplication.id },
      data: {
        verificationStatus: "COMPLETED",
        reviewAnswer: payload.reviewResult.reviewAnswer as any,
        reviewRejectType: payload.reviewResult.reviewRejectType as any,
        reviewedAt: new Date(parseInt(payload.createdAtMs)),
        updatedAt: new Date(),
      },
    });

    return updatedApplication;
  } catch (error) {
    console.error("Error updating Sumsub application:", error);
    throw error;
  }
}

// Store review history
async function storeReviewHistory(
  sumsubApplicationId: string,
  payload: ApplicantReviewedPayload
) {
  try {
    const reviewHistory = await prisma.sumsubReviewHistory.create({
      data: {
        sumsubApplicationId,
        reviewAnswer: payload.reviewResult.reviewAnswer as any,
        reviewRejectType: payload.reviewResult.reviewRejectType as any,
        rejectLabels: payload.reviewResult.rejectLabels || [],
        buttonIds: payload.reviewResult.buttonIds || [],
        moderationComment: payload.reviewResult.moderationComment,
        clientComment: payload.reviewResult.clientComment,
        reviewMode: payload.reviewMode,
        reviewedAt: new Date(parseInt(payload.createdAtMs)),
      },
    });

    return reviewHistory;
  } catch (error) {
    console.error("Error storing review history:", error);
    throw error;
  }
}

// Mark webhook event as processed
async function markWebhookEventProcessed(
  webhookEventId: string,
  success: boolean,
  error?: string
) {
  try {
    await prisma.sumsubWebhookEvent.update({
      where: { id: webhookEventId },
      data: {
        processed: true,
        processedAt: new Date(),
        errorMessage: error || null,
      },
    });
  } catch (updateError) {
    console.error("Error updating webhook event status:", updateError);
  }
}

// Process applicantReviewed webhook with database interactions
async function processApplicantReviewed(payload: ApplicantReviewedPayload) {
  console.log("Processing applicantReviewed webhook:", {
    applicantId: payload.applicantId,
    externalUserId: payload.externalUserId,
    reviewAnswer: payload.reviewResult.reviewAnswer,
    reviewStatus: payload.reviewStatus,
  });

  let webhookEvent: any = null;

  try {
    // Find or create Sumsub application record
    const sumsubApplication = await findOrCreateSumsubApplication(payload);

    // Store webhook event for audit trail and idempotency
    webhookEvent = await storeWebhookEvent(payload, sumsubApplication.id);

    // If already processed, return early
    if (webhookEvent.processed) {
      return;
    }

    // Update application with review results
    await updateSumsubApplicationWithReview(sumsubApplication, payload);

    // Store review history
    await storeReviewHistory(sumsubApplication.id, payload);

    // Handle different review answers
    switch (payload.reviewResult.reviewAnswer) {
      case "GREEN":
        await handleApprovedApplicant(payload, sumsubApplication);
        break;
      case "RED":
        await handleRejectedApplicant(payload, sumsubApplication);
        break;
      case "YELLOW":
        await handlePendingApplicant(payload, sumsubApplication);
        break;
      default:
        console.warn(
          "Unknown review answer:",
          payload.reviewResult.reviewAnswer
        );
    }

    // Mark webhook as successfully processed
    await markWebhookEventProcessed(webhookEvent.id, true);
  } catch (error) {
    console.error("Error processing applicant reviewed webhook:", error);

    // Mark webhook as failed if we have the webhook event
    if (webhookEvent) {
      await markWebhookEventProcessed(
        webhookEvent.id,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    throw error;
  }
}

// Handle approved applicant
async function handleApprovedApplicant(
  payload: ApplicantReviewedPayload,
  sumsubApplication: any
) {
  try {
    console.log(`Applicant ${payload.applicantId} approved`);

    // Update user's verification status
    await prisma.user.update({
      where: { id: sumsubApplication.userId },
      data: {
        // Add your user fields for KYC status
        // kycStatus: 'approved',
        // kycCompletedAt: new Date(parseInt(payload.createdAtMs)),
        updatedAt: new Date(),
      },
    });

    // Add your business logic here:
    // - Send approval email
    // - Enable user features
    // - Trigger other workflows
  } catch (error) {
    console.error("Error handling approved applicant:", error);
    throw error;
  }
}

// Handle rejected applicant
async function handleRejectedApplicant(
  payload: ApplicantReviewedPayload,
  sumsubApplication: any
) {
  try {
    console.log(`Applicant ${payload.applicantId} rejected`);
    console.log("Reject labels:", payload.reviewResult.rejectLabels);
    console.log("Reject type:", payload.reviewResult.reviewRejectType);

    const isRetryAllowed = payload.reviewResult.reviewRejectType === "RETRY";

    // Update user's verification status
    await prisma.user.update({
      where: { id: sumsubApplication.userId },
      data: {
        // Add your user fields for KYC status
        // kycStatus: isRetryAllowed ? 'rejected_retry' : 'rejected_final',
        // kycRejectedAt: new Date(parseInt(payload.createdAtMs)),
        // kycRejectReason: payload.reviewResult.rejectLabels?.join(', '),
        updatedAt: new Date(),
      },
    });

    // Add your business logic here:
    // - Send rejection email with reason
    // - Handle retry vs final rejection
  } catch (error) {
    console.error("Error handling rejected applicant:", error);
    throw error;
  }
}

// Handle pending applicant (manual review required)
async function handlePendingApplicant(
  payload: ApplicantReviewedPayload,
  sumsubApplication: any
) {
  try {
    console.log(`Applicant ${payload.applicantId} requires manual review`);

    // Update user's verification status
    await prisma.user.update({
      where: { id: sumsubApplication.userId },
      data: {
        // Add your user fields for KYC status
        // kycStatus: 'pending_manual_review',
        // kycPendingAt: new Date(parseInt(payload.createdAtMs)),
        updatedAt: new Date(),
      },
    });

    // Add your business logic here:
    // - Send pending notification
    // - Alert admin team for manual review
  } catch (error) {
    console.error("Error handling pending applicant:", error);
    throw error;
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    // Read the raw body
    const body = await request.text();

    // Get signature headers (note the correct header names from Sumsub docs)
    const payloadDigest = request.headers.get("x-payload-digest");
    const payloadDigestAlgorithm = request.headers.get("x-payload-digest-alg");

    console.log("Webhook headers:", {
      payloadDigest: payloadDigest ? "present" : "missing",
      payloadDigestAlgorithm,
      bodyLength: body.length,
      allHeaders: Object.fromEntries(request.headers.entries()),
    });

    // Verify webhook secret is configured
    if (!SUMSUB_WEBHOOK_SECRET) {
      console.error("SUMSUB_WEBHOOK_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify signature using Sumsub's format
    if (
      !payloadDigest ||
      !payloadDigestAlgorithm ||
      !verifySignature(
        body,
        payloadDigest,
        payloadDigestAlgorithm,
        SUMSUB_WEBHOOK_SECRET
      )
    ) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse JSON payload
    let payload: ApplicantReviewedPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error("Invalid JSON payload:", error);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify this is an applicantReviewed webhook
    if (payload.type !== "applicantReviewed") {
      console.log(`Received webhook type: ${payload.type}, ignoring`);
      return NextResponse.json(
        { message: "Webhook type not handled" },
        { status: 200 }
      );
    }

    // Log webhook receipt
    console.log("Received applicantReviewed webhook:", {
      applicantId: payload.applicantId,
      externalUserId: payload.externalUserId,
      reviewAnswer: payload.reviewResult.reviewAnswer,
      correlationId: payload.correlationId,
      sandboxMode: payload.sandboxMode,
    });

    // Process the webhook with database interactions
    await processApplicantReviewed(payload);

    // Return success response
    return NextResponse.json(
      {
        message: "Webhook processed successfully",
        correlationId: payload.correlationId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // Clean up Prisma connection
    await prisma.$disconnect();
  }
}

// Optional: Handle GET requests for webhook endpoint verification
export async function GET() {
  return NextResponse.json({
    message: "Sumsub webhook endpoint is active",
    supportedEvents: ["applicantReviewed"],
    timestamp: new Date().toISOString(),
  });
}
