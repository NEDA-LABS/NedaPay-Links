// app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllOrders } from '@/utils/paycrest'; // Adjust the import path as needed

export async function GET(request: NextRequest) {
  try {
    // Security check for admin access
    const accessKey = request.headers.get('x-admin-access-key');
    const expectedKey = process.env.NEXT_PUBLIC_APP_ACCESS;
    
    if (!accessKey || accessKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const token = searchParams.get('token');
    const network = searchParams.get('network');
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const timePeriod = searchParams.get('timePeriod');

    // Build query parameters for the PayCrest API
    const pageNum = parseInt(page || '1');
    const pageSizeNum = parseInt('10000');
    
    // Fetch orders from PayCrest API with all filters and pagination
    const ordersResponse = await fetchAllOrders({
      ordering: '-createdAt', // Newest first
      status: status || undefined,
      token: token || undefined,
      network: network || undefined,
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: pageNum,
      pageSize: pageSizeNum
    });
    
    if (ordersResponse.status !== 'success') {
      return NextResponse.json(
        { error: 'Failed to fetch orders from PayCrest' },
        { status: 500 }
      );
    }

    const { orders, total } = ordersResponse.data;

    // Calculate summary statistics based on the paginated results
    const summary = {
      totalTransactions: total, // Use the total count from the API
      totalAmount: orders.reduce((sum, order) => sum + parseFloat(order.amount), 0),
      totalAmountPaid: orders
        .filter(order => order.status.toLowerCase() === 'settled')
        .reduce((sum, order) => sum + parseFloat(order.amountPaid), 0),
      totalFees: orders
        .filter(order => order.status.toLowerCase() === 'settled')
        .reduce((sum, order) => sum + parseFloat(order.senderFee) + parseFloat(order.transactionFee), 0),
      
      // By status
      byStatus: {
        pending: orders.filter(o => o.status.toLowerCase() === 'pending').length,
        settled: orders.filter(o => o.status.toLowerCase() === 'settled').length,
        expired: orders.filter(o => o.status.toLowerCase() === 'expired').length,
        refunded: orders.filter(o => o.status.toLowerCase() === 'refunded').length,
      },
      
      // By token
      byToken: orders.reduce((acc, order) => {
        const token = order.token;
        if (!acc[token]) {
          acc[token] = {
            count: 0,
            totalAmount: 0,
            totalPaid: 0
          };
        }
        acc[token].count++;
        acc[token].totalAmount += parseFloat(order.amount);
        acc[token].totalPaid += parseFloat(order.amountPaid);
        return acc;
      }, {} as Record<string, { count: number; totalAmount: number; totalPaid: number }>),
      
      // By network
      byNetwork: orders.reduce((acc, order) => {
        const network = order.network;
        acc[network] = (acc[network] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Recent activity (last 7 days)
      recentActivity: orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return orderDate >= sevenDaysAgo;
        })
        .reduce((acc, order) => {
          const date = new Date(order.createdAt).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };

    return NextResponse.json({
      message: 'Orders fetched successfully',
      status: 'success',
      data: {
        summary,
        orders,
        pagination: {
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(total / pageSizeNum)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}