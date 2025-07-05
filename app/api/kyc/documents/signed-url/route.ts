
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSignedUrl } from '@/utils/supabase/supabase'

const prisma = new PrismaClient()
const STORAGE_BUCKET = 'master-verify'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('userId')
    const url = searchParams.get('url')

    if (!walletAddress || !url) {
      return NextResponse.json(
        { success: false, message: 'Wallet address and document ID are required' },
        { status: 400 }
      )
    }

    // Find the KYC application for the user
    const kycApplication = await prisma.kYCApplication.findUnique({
      where: { wallet: walletAddress }
    })

    if (!kycApplication) {
      return NextResponse.json(
        { success: false, message: 'KYC application not found' },
        { status: 404 }
      )
    }

    // Find the document
    const document = await prisma.document.findFirst({
      where: {
        storageUrl: url,
        kycApplicationId: kycApplication.id
      }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      )
    }

    // Generate signed URL (expires in 1 hour)
    const signedUrl = await getSignedUrl(STORAGE_BUCKET, document.storageKey, 3600)

    return NextResponse.json({
      success: true,
      signedUrl,
      filename: document.originalName
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}