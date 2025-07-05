
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

    // Find the KYB application for the user
    const kybApplication = await prisma.kYBApplication.findUnique({
      where: { wallet: walletAddress }
    })

    if (!kybApplication) {
      return NextResponse.json(
        { success: false, message: 'KYB application not found' },
        { status: 404 }
      )
    }

    // Find the document
    const document = await prisma.document.findFirst({
      where: {
        storageUrl: url,
        kybApplicationId: kybApplication.id
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