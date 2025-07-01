
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('Received KYC personal info request');
    const data = await request.json();
    console.log('Received data:', {
      userId: data.userId,
      wallet: data.wallet,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      countryOfResidence: data.countryOfResidence,
      phoneNumber: data.phoneNumber,
      email: data.email,
      street: data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    });
    
    // Validate required fields
    if (!data.userId) {
      console.error('Error: User ID is missing in request');
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create KYC application with personal info
    console.log('Creating KYC application with data:', {
      userId: data.userId,
      wallet: data.wallet,
      status: 'PENDING_DOCUMENTS',
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      nationality: data.nationality,
      countryOfResidence: data.countryOfResidence,
      phoneNumber: data.phoneNumber,
      email: data.email,
      street: data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    });
    
    const kycApplication = await prisma.kYCApplication.create({
      data: {
        userId: data.userId,
        wallet: data.wallet,
        status: 'PENDING_DOCUMENTS',
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        nationality: data.nationality,
        countryOfResidence: data.countryOfResidence,
        phoneNumber: data.phoneNumber,
        email: data.email,
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.postalCode,
        country: data.address.country,
      }
    })

    console.log('KYC application created successfully:', kycApplication);
    return NextResponse.json({
      success: true,
      message: 'Personal information saved successfully',
      applicationId: kycApplication.id,
      data: {
        ...data,
        id: kycApplication.id,
        createdAt: kycApplication.createdAt.toISOString(),
        status: kycApplication.status
      }
    })
  } catch (error) {
    console.error('Error processing personal info:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process personal information' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'KYC Personal Info API endpoint',
    methods: ['POST']
  })
}
