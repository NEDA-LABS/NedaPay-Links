
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Mock API response - replace with actual backend integration
    console.log('KYC Financial Info submitted:', data)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return NextResponse.json({
      success: true,
      message: 'Financial information saved successfully',
      data: {
        ...data,
        id: `financial-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'PENDING_REVIEW'
      }
    })
  } catch (error) {
    console.error('Error processing financial info:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process financial information' },
      { status: 500 }
    )
  }
}
