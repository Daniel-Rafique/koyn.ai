import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationToken } from '@/lib/email-verification'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { validateRequest, validationPatterns } from '@/lib/validation'
import { z } from 'zod'

const resendSchema = z.object({
  email: validationPatterns.email
})

async function resendVerificationHandler(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = validateRequest(resendSchema)(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const { email } = validation.data
    const result = await resendVerificationToken(email)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Verification email sent successfully'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(rateLimiters.auth, resendVerificationHandler) 