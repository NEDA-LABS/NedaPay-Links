
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const applicationId = formData.get('applicationId') as string
    
    // Find or create the KYC application
    const kycApplication = await prisma.kYCApplication.findUnique({
      where: { wallet: applicationId }
    })

    if (!kycApplication) {
      return NextResponse.json(
        { success: false, message: 'KYC application not found' },
        { status: 404 }
      )
    }

    // Process each file and create Document records
    const documents = await Promise.all(
      files.map(async (file, index) => {
        // Here you would typically upload the file to storage (e.g., S3)
        // and get a storage key and URL
        const storageKey = `kyc-documents/${applicationId}/${file.name}`
        const storageUrl = `https://your-storage-bucket/${storageKey}`

        return prisma.document.create({
          data: {
            filename: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            documentType: 'PASSPORT', // You might want to pass this from frontend
            status: 'UPLOADED',
            storageKey,
            storageUrl,
            kycApplicationId: kycApplication.id
          }
        })
      })
    )

    // Update KYC application status
    await prisma.kYCApplication.update({
      where: { id: kycApplication.id },
      data: {
        status: 'PENDING_FINANCIAL_INFO'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        applicationId,
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          size: doc.fileSize,
          type: doc.mimeType,
          uploadedAt: doc.uploadedAt.toISOString(),
          status: doc.status,
          storageUrl: doc.storageUrl
        })),
        status: 'PENDING_FINANCIAL_INFO'
      }
    })
  } catch (error) {
    console.error('Error uploading documents:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload documents' },
      { status: 500 }
    )
  }
}
