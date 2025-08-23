// app/api/admin/broadcast-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch broadcast notifications with analytics
export async function GET() {
  try {
    const broadcastNotifications = await prisma.broadcastNotification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            notifications: {
              where: {
                type: 'broadcast'
              }
            }
          }
        }
      }
    });

    // Get analytics for each broadcast notification
    const notificationsWithAnalytics = await Promise.all(
      broadcastNotifications.map(async (notification) => {
        const seenCount = await prisma.notification.count({
          where: {
            broadcastId: notification.id,
            type: 'broadcast',
            status: 'seen'
          }
        });

        const unseenCount = await prisma.notification.count({
          where: {
            broadcastId: notification.id,
            type: 'broadcast',
            status: 'unseen'
          }
        });

        return {
          ...notification,
          analytics: {
            total: notification._count.notifications,
            seen: seenCount,
            unseen: unseenCount
          }
        };
      })
    );

    return NextResponse.json(notificationsWithAnalytics);
  } catch (error) {
    console.error('Error fetching broadcast notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcast notifications' },
      { status: 500 }
    );
  }
}

// DELETE - Remove broadcast notification and associated user notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Delete all associated user notifications first
    await prisma.notification.deleteMany({
      where: {
        broadcastId: id
      }
    });

    // Delete the broadcast notification
    await prisma.broadcastNotification.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}