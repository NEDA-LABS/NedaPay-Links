import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  countryOfResidence: z.string().min(1, 'Country of residence is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address'),
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    postalCode: z.string().min(4, 'Valid postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  userId: z.string(),
  wallet: z.string()
});

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const wallet = searchParams.get('wallet')

    if (!userId && !wallet) {
      return NextResponse.json(
        { success: false, message: 'userId or wallet is required' },
        { status: 400 }
      )
    }

    const whereClause = {
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(wallet ? [{ wallet }] : [])
      ]
    };

    const application = await prisma.kYCApplication.findFirst({
      where: whereClause
    })

    if (!application) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        firstName: application.firstName || '',
        middleName: application.middleName || '',
        lastName: application.lastName || '',
        dateOfBirth: application.dateOfBirth?.toISOString() || '',
        nationality: application.nationality || '',
        countryOfResidence: application.countryOfResidence || '',
        phoneNumber: application.phoneNumber || '',
        email: application.email || '',
        address: {
          street: application.street || '',
          city: application.city || '',
          state: application.state || '',
          postalCode: application.postalCode || '',
          country: application.country || ''
        }
      }
    })
  } catch (error) {
    console.error('Error fetching personal info:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch personal info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Received data:', data);
    // Validate data
    const result = personalInfoSchema.safeParse(data)
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: result.error.errors },
        { status: 400 }
      )
    }

    // Find existing KYC application
    const whereClause = {
      OR: [
        ...(data.userId ? [{ userId: data.userId }] : []),
        ...(data.wallet ? [{ wallet: data.wallet }] : [])
      ]
    };

    const existingApplication = await prisma.kYCApplication.findFirst({
      where: whereClause
    })

    if (existingApplication) {
      // Update existing application
      const updated = await prisma.kYCApplication.update({
        where: { id: existingApplication.id },
        data: {
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
          country: data.address.country
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          applicationId: existingApplication.id,
          status: existingApplication.status
        }
      })
    }

    // Create new KYC application with personal info
    const application = await prisma.kYCApplication.create({
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
        country: data.address.country
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.id,
        status: application.status
      }
    })
  } catch (error) {
    console.error('Error creating/updating KYC application:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create/update KYC application' },
      { status: 500 }
    )
  }
}
