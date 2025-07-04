import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { BusinessType } from '../../../compliance/user/types/kyc'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check for existing business info with the same user
    const existingInfo = await prisma.kYBApplication.findUnique({
      where: { userId: data.userId }
    })

    // Update existing info if found, otherwise create new
    // Convert businessType string to enum value
    const businessTypeValue = data.businessType.toUpperCase();
    const validBusinessTypes = Object.values(BusinessType);
    const prismaBusinessType = validBusinessTypes.find(type => type === businessTypeValue) as BusinessType;

    if (!prismaBusinessType) {
      return NextResponse.json(
        { success: false, message: 'Invalid business type' },
        { status: 400 }
      );
    }

    const businessInfo = existingInfo 
      ? await prisma.kYBApplication.update({
          where: { userId: data.userId },
          data: {
            ...data,
            businessType: prismaBusinessType,
            incorporationDate: new Date(data.incorporationDate),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      : await prisma.kYBApplication.create({
          data: {
            ...data,
            businessType: prismaBusinessType,
            incorporationDate: new Date(data.incorporationDate),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

    return NextResponse.json({
      success: true,
      message: 'Business information saved successfully',
      data: {
        ...businessInfo,
        incorporationDate: businessInfo?.incorporationDate?.toISOString(),
        createdAt: businessInfo.createdAt.toISOString(),
        updatedAt: businessInfo.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error saving business information:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save business information' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const businessInfo = await prisma.kYBApplication.findUnique({
      where: { userId }
    })

    if (!businessInfo) {
      return NextResponse.json({
        success: true,
        message: 'No business information found',
        data: null
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Business information retrieved successfully',
      data: {
        ...businessInfo,
        incorporationDate: businessInfo?.incorporationDate?.toISOString(),
        createdAt: businessInfo.createdAt.toISOString(),
        updatedAt: businessInfo.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error retrieving business information:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve business information' },
      { status: 500 }
    )
  }
}
