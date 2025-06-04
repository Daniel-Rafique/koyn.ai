import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email-verification'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

async function verifyEmailHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      email: result.email
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(rateLimiters.auth, verifyEmailHandler) 