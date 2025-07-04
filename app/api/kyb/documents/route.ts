import { NextRequest, NextResponse } from 'next/server'
import { $Enums, PrismaClient } from '@prisma/client'
import { uploadToBucket, getPublicUrl, deleteFromBucket } from '@/utils/supabase/supabase' // Adjust path as needed
import { DocumentType } from '@/compliance/user/types/kyc'

// Define valid KYB document types
const KYB_DOCUMENT_TYPES = [
  DocumentType.BUSINESS_REGISTRATION,
  DocumentType.TAX_CERTIFICATE,
  DocumentType.FINANCIAL_STATEMENT
] as const

type ValidKYBDocumentType = typeof KYB_DOCUMENT_TYPES[number]

const prisma = new PrismaClient()

// Define your Supabase storage bucket name here
const STORAGE_BUCKET = 'master-verify' // Replace with your actual bucket name

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

    // Fetch documents for this KYB application
    const documents = await prisma.document.findMany({
      where: {
        kybApplicationId: kybApplication.id
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
    // console.log('Received request:', {
    //   headers: Object.fromEntries(request.headers.entries()),
    //   method: request.method
    // });

    const formData = await request.formData()
    // console.log('Form data received:', {
    //   hasFiles: formData.has('files'),
    //   hasCurrentAddress: formData.has('currentAddress'),
    //   hasDocumentType: formData.has('documentType')
    // });

    const file = formData.get('files') as File
    const applicationId = formData.get('currentAddress') as string
    const type = formData.get('documentType') as DocumentType

    // console.log('Parsed values:', {
    //   file: file ? file.name : 'No file',
    //   applicationId,
    //   type
    // });

    if (!file) {
      // console.log('Error: No file provided');
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type) {
      // console.log('Error: Document type is required');
      return NextResponse.json(
        { success: false, message: 'Document type is required' },
        { status: 400 }
      )
    }

    const documentType = type.toUpperCase() as ValidKYBDocumentType
    // console.log('Document type validation:', {
    //   rawType: type,
    //   convertedType: documentType,
    //   isValid: KYB_DOCUMENT_TYPES.includes(documentType)
    // });

    if (!KYB_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid document type. Valid types are: ' + 
            KYB_DOCUMENT_TYPES.join(', ') 
        },
        { status: 400 }
      )
    }

    // Validate wallet address
    if (!applicationId || !/^0x[0-9a-fA-F]{40}$/.test(applicationId)) {
      // console.log('Error: Invalid wallet address');
      return NextResponse.json(
        { success: false, message: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    // Find or create the KYB application
    // console.log('Looking for KYB application with userId:', applicationId);
    const kybApplication = await prisma.kYBApplication.findUnique({
      where: { wallet: applicationId }
    })
    // console.log('Found KYB application:', kybApplication);
    if (!kybApplication) {
      return NextResponse.json(
        { success: false, message: 'KYB application not found' },
        { status: 404 }
      )
    }

    // Create a unique file path
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}.${fileExtension}`
    const filePath = `${applicationId}/${type}/${fileName}`

    try {
      // Check if file already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          kybApplicationId: kybApplication.id,
          documentType: documentType as $Enums.DocumentType
        }
      })

      if (existingDoc) {
        // Delete existing file from storage
        await deleteFromBucket(STORAGE_BUCKET, existingDoc.storageKey)
        // Delete existing document record
        await prisma.document.delete({ where: { id: existingDoc.id } })
      }

      try {
        // Upload file to Supabase Storage
        // console.log('Uploading file to:', filePath);
        const uploadResult = await uploadToBucket(STORAGE_BUCKET, filePath, file)
        // console.log('Upload result:', uploadResult);
        
        // Get public URL for the uploaded file
        const publicUrl = getPublicUrl(STORAGE_BUCKET, filePath)
        // console.log('Generated public URL:', publicUrl);

        // Create document record in database
        // console.log('Creating document record with:', {
        //   filename: fileName,
        //   originalName: file.name,
        //   documentType: documentType,
        //   kybApplicationId: kybApplication.id
        // });
        const document = await prisma.document.create({
          data: {
            filename: fileName,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            documentType: documentType as $Enums.DocumentType,
            status: 'UPLOADED',
            storageKey: filePath,
            storageUrl: publicUrl,
            kybApplicationId: kybApplication.id
          }
        }) as unknown as {
          id: string;
          storageUrl: string;
          filename: string;
          originalName: string;
          fileSize: number;
          mimeType: string;
          documentType: string;
          status: string;
          uploadedAt: Date;
          storageKey: string;
          kybApplicationId: string;
        }

        // console.log('Document created successfully:', {
        //   id: document.id,
        //   storageUrl: document.storageUrl,
        //   filename: document.filename,
        //   originalName: document.originalName,
        //   fileSize: document.fileSize,
        //   mimeType: document.mimeType,
        //   documentType: document.documentType,
        //   status: document.status,
        //   uploadedAt: document.uploadedAt.toISOString(),
        //   storageKey: document.storageKey,
        //   kybApplicationId: document.kybApplicationId
        // });

        // Update KYB application status
        await prisma.kYBApplication.update({
          where: { id: kybApplication.id },
          data: {
            status: 'PENDING_REVIEW'
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Document uploaded successfully',
          documents: [{
            id: document.id,
            filename: document.filename,
            originalName: document.originalName,
            size: document.fileSize,
            type: document.mimeType,
            uploadedAt: document.uploadedAt.toISOString(),
            status: document.status,
            storageUrl: document.storageUrl
          }]
        });
      } catch (uploadError) {
        console.error('Error during upload:', uploadError);
        throw uploadError;
      }

      // Update KYC application status
      // await prisma.kYBApplication.update({
      //   where: { id: kybApplication.id },
      //   data: {
      //     status: 'PENDING_REVIEW'
      //   }
      // })

      // return NextResponse.json({
      //   success: true,
      //   message: 'Document uploaded successfully',
      //   documents: [{
      //     id: document.id,
      //     filename: document.filename,
      //     originalName: document.originalName,
      //     size: document.fileSize,
      //     type: document.mimeType,
      //     uploadedAt: document.uploadedAt.toISOString(),
      //     status: document.status,
      //     storageUrl: document.storageUrl
      //   }]
      // })
    } catch (uploadError) {
      console.error('Error uploading document:', uploadError)
      throw uploadError;
    }
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    )
  }
}