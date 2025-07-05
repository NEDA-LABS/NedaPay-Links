import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, DocumentType } from '@prisma/client'
import { uploadToBucket, getPublicUrl, deleteFromBucket } from '@/utils/supabase/supabase'

const prisma = new PrismaClient()

const STORAGE_BUCKET = 'master-verify' 

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('userId')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet Address is required' },
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

    // Fetch documents for this KYC application
    const documents = await prisma.document.findMany({
      where: {
        kycApplicationId: kycApplication.id
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        documentType: doc.documentType,
        status: doc.status,
        uploadedAt: doc.uploadedAt.toISOString(),
        storageUrl: doc.storageUrl
      }))
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
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

    // Process each document type
    const documentTypes: DocumentType[] = [DocumentType.GOVERNMENT_ISSUED_ID, DocumentType.SELFIE];
    const documents = await Promise.all(
      documentTypes.map(async (docType) => {
        const file = formData.get(`file_${docType}`) as File | null;
        if (!file) return null;

        try {
          // Create a unique file path
          const timestamp = Date.now()
          const fileExtension = file.name.split('.').pop()
          const fileName = `${timestamp}-${docType}.${fileExtension}`
          const filePath = `${applicationId}/${fileName}`

          // Upload file to Supabase Storage
          const uploadResult = await uploadToBucket(STORAGE_BUCKET, filePath, file)
          
          // Get public URL for the uploaded file
          const publicUrl = getPublicUrl(STORAGE_BUCKET, filePath)

          // Create document record in database
          return prisma.document.create({
            data: {
              filename: fileName,
              originalName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              documentType: docType,
              status: 'UPLOADED',
              storageKey: filePath,
              storageUrl: publicUrl,
              kycApplicationId: kycApplication.id
            }
          })
        } catch (uploadError) {
          console.error(`Error uploading ${docType} document:`, uploadError)
          throw new Error(`Failed to upload ${docType} document`)
        }
      })
    )

    // Filter out null results (documents that weren't uploaded)
    const uploadedDocuments = documents.filter((doc) => doc !== null)

    // Update KYC application status
    await prisma.kYCApplication.update({
      where: { id: kycApplication.id },
      data: {
        status: 'PENDING_REVIEW'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        applicationId,
        documents: uploadedDocuments.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          originalName: doc.originalName,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('storageUrl')

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'Document URL is required' },
        { status: 400 }
      )
    }

    // Find the document
    const document = await prisma.document.findFirst({
      where: { storageUrl: url }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete the file from Supabase storage
    await deleteFromBucket(STORAGE_BUCKET, document.storageKey)

    // Delete the document record from database
    await prisma.document.delete({ where: { id: document.id } })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    )
  }
}