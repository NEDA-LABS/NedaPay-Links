
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  
  try {
    const { wallet, updateData } = await request.json()

    // Update KYC application using wallet as identifier
    const updatedApplication = await prisma.kYCApplication.update({
      where: {
        wallet
      },
      data: {
        ...updateData,
        // submittedAt: updateData.submittedAt instanceof Date ? updateData.submittedAt : new Date(updateData.submittedAt),
        // agreements: {
        //   termsAccepted: updateData.agreements?.termsAccepted,
        //   privacyAccepted: updateData.agreements?.privacyAccepted,
        //   acceptedAt: updateData.agreements?.acceptedAt instanceof Date ? updateData.agreements.acceptedAt : new Date(updateData.agreements.acceptedAt)
        // }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'KYC application updated successfully',
      data: {
        applicationId: updatedApplication.id,
        status: updatedApplication.status,
        submittedAt: updatedApplication.submittedAt,
        estimatedProcessingTime: '1-3 business days',
        nextSteps: [
          'Your application is being reviewed',
          'You will receive email notifications about status updates',
          'Additional documents may be requested if needed'
        ]
      }
    })

  } catch (error) {
    console.error('Error updating KYC application:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update KYC application' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet parameter is required' }, { status: 400 })
    }

    const kycApplication = await prisma.kYCApplication.findUnique({
      where: {
        wallet
      }
    })

    return NextResponse.json({
      isSubmitted: kycApplication?.status === 'SUBMITTED'
    })
  } catch (error) {
    console.error('Error checking KYC submission status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
