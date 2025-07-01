import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { uploadToBucket, getPublicUrl } from '@/utils/supabase/supabase' // Adjust path as needed

const prisma = new PrismaClient()

// Define your Supabase storage bucket name here
const STORAGE_BUCKET = 'master-verify' // Replace with your actual bucket name

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const applicationId = formData.get('applicationId') as string
    console.log("applicationId", applicationId);

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
        try {
          // Create a unique file path
          const timestamp = Date.now()
          const fileExtension = file.name.split('.').pop()
          const fileName = `${timestamp}-${index}.${fileExtension}`
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
              documentType: 'NATIONAL_ID', // You might want to pass this from frontend
              status: 'UPLOADED',
              storageKey: filePath,
              storageUrl: publicUrl,
              kycApplicationId: kycApplication.id
            }
          })
        } catch (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError)
          throw new Error(`Failed to upload file: ${file.name}`)
        }
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