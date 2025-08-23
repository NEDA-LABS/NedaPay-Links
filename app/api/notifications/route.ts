import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, recipient, type, status, relatedTransactionId, broadcastId } = body;

    // Validate required fields
    if (!message || !recipient || !type || !status) {
      return NextResponse.json(
        { error: "Missing required fields: message, recipient, type, status" },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ["seen", "unseen"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'seen' or 'unseen'" },
        { status: 400 }
      );
    }

    // If broadcastId is provided, check for existing notification to prevent duplicates
    if (broadcastId) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          broadcastId: broadcastId,
          recipient: recipient,
        },
      });

      if (existingNotification) {
        return NextResponse.json(
          { error: "Notification with this broadcastId already exists for this recipient" },
          { status: 409 } // Conflict status code
        );
      }
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        message,
        recipient,
        type,
        status,
        relatedTransactionId: relatedTransactionId || null,
        broadcastId: broadcastId || null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// GET - Retrieve notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipient = searchParams.get("recipient");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const broadcastId = searchParams.get("broadcastId");
    const limit = searchParams.get("limit");

    // Require recipient parameter
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient parameter is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {};
    where.recipient = recipient; // Always filter by recipient
    if (status) where.status = status;
    if (type) where.type = type;
    if (broadcastId) where.broadcastId = broadcastId;

    // Build query options
    const queryOptions: any = {
      where,
      orderBy: { createdAt: "desc" },
      include: {
        relatedTransaction: true, // Include transaction details if needed
      },
    };

    if (limit) {
      queryOptions.take = parseInt(limit);
    }

    const notifications = await prisma.notification.findMany(queryOptions);

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PUT - Update notification status (e.g., mark as seen)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const broadcastId = searchParams.get("broadcastId");
    const recipient = searchParams.get("recipient");
    const body = await request.json();
    const { status } = body;

    // Validate that we have either notificationId or (broadcastId + recipient)
    if (!notificationId && (!broadcastId || !recipient)) {
      return NextResponse.json(
        { error: "Either notification ID or (broadcastId + recipient) is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ["seen", "unseen"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'seen' or 'unseen'" },
        { status: 400 }
      );
    }

    let updatedNotification;

    if (notificationId) {
      // Update by notification ID
      updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { status },
      });
    } else if (broadcastId && recipient) {
      // Update by broadcastId and recipient
      updatedNotification = await prisma.notification.updateMany({
        where: {
          broadcastId: broadcastId,
          recipient: recipient,
        },
        data: { status },
      });
    }

    return NextResponse.json(updatedNotification, { status: 200 });
  } catch (error: any) {
    console.error("Error updating notification:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const broadcastId = searchParams.get("broadcastId");
    const recipient = searchParams.get("recipient");

    // Validate that we have either notificationId or (broadcastId + recipient)
    if (!notificationId && (!broadcastId || !recipient)) {
      return NextResponse.json(
        { error: "Either notification ID or (broadcastId + recipient) is required" },
        { status: 400 }
      );
    }

    if (notificationId) {
      // Delete by notification ID
      await prisma.notification.delete({
        where: { id: notificationId },
      });
    } else if (broadcastId && recipient) {
      // Delete by broadcastId and recipient
      // We've already validated that both broadcastId and recipient exist
      await prisma.notification.deleteMany({
        where: {
          broadcastId: broadcastId,
          recipient: recipient as string, // Type assertion since we've validated it's not null
        },
      });
    }

    return NextResponse.json(
      { message: "Notification deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}