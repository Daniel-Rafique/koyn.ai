import crypto from 'crypto'
import { prisma } from './database'

// Add debug logging helper
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EMAIL VERIFY] ${message}`, data ? data : '')
  }
}

// Generate email verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Create verification token in database
export async function createVerificationToken(userId: string, email: string): Promise<string> {
  debugLog("Creating verification token", { userId, email })
  const token = generateVerificationToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: expiresAt
    }
  })
  debugLog("Verification token created", { email, expires: expiresAt })

  return token
}

// Verify email token
export async function verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    debugLog("Verifying email token", { token: token.substring(0, 10) + '...' })
    
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      debugLog("Invalid verification token")
      return { success: false, error: 'Invalid verification token' }
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token }
      })
      debugLog("Token expired", { email: verificationToken.identifier })
      return { success: false, error: 'Verification token has expired' }
    }

    // Update user as verified
    const user = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() }
    })
    debugLog("User verified successfully", { email: user.email, id: user.id })

    // Clean up used token
    await prisma.verificationToken.delete({
      where: { token }
    })

    return { success: true, email: verificationToken.identifier }
  } catch (error) {
    console.error('Email verification error:', error)
    debugLog("Verification error", { message: (error as Error).message })
    return { success: false, error: 'Verification failed' }
  }
}

// Resend verification email
export async function resendVerificationToken(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    debugLog("Resending verification email", { email })
    
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      debugLog("User not found", { email })
      return { success: false, error: 'User not found' }
    }

    if (user.emailVerified) {
      debugLog("Email already verified", { email })
      return { success: false, error: 'Email already verified' }
    }

    // Clean up existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })
    debugLog("Cleaned up existing tokens", { email })

    // Create new token
    const token = await createVerificationToken(user.id, email)
    await sendVerificationEmail(email, token)
    debugLog("Verification email resent", { email })

    return { success: true }
  } catch (error) {
    console.error('Resend verification error:', error)
    debugLog("Resend verification error", { message: (error as Error).message })
    return { success: false, error: 'Failed to resend verification' }
  }
}

// Email sending function (mock implementation)
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.NEXTAUTH_URL;
    
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`
  debugLog("Sending verification email", { email, verificationUrl })
  
  // In production, use a real email service like SendGrid, Resend, etc.
  console.log(`
    📧 Email Verification
    To: ${email}
    Subject: Verify your Koyn.AI account
    
    Click the link below to verify your email address:
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
  `)

  // TODO: Replace with actual email service
  // await emailService.send({
  //   to: email,
  //   subject: 'Verify your Koyn.AI account',
  //   html: emailTemplate,
  //   text: emailText
  // })
}

// Check if email is verified
export async function isEmailVerified(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true }
    })

    const verified = !!user?.emailVerified
    debugLog("Checking email verification", { email, verified })
    return verified
  } catch (error) {
    console.error('Check email verification error:', error)
    debugLog("Verification check error", { message: (error as Error).message })
    return false
  }
} 