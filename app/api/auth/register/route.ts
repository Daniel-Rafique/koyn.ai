import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/database"
import { withRateLimit, rateLimiters } from "@/lib/rate-limit"
import { validateRequest, userSchemas, sanitizers, securityValidation } from "@/lib/validation"
import { createVerificationToken, sendVerificationEmail } from "@/lib/email-verification"

async function registerHandler(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data using our schema
    const validation = validateRequest(userSchemas.register)(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.errors.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { email, username, displayName, password, role } = validation.data

    // Security checks
    if (securityValidation.hasSQLInjection(email) || 
        securityValidation.hasSQLInjection(username) ||
        securityValidation.hasXSS(email) || 
        securityValidation.hasXSS(username)) {
      return NextResponse.json(
        { error: "Invalid input detected" },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedDisplayName = sanitizers.html(displayName || username)

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    // Check if display name is already taken (using name field)
    const existingUserByName = await prisma.user.findFirst({
      where: { name: username }
    })

    if (existingUserByName) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      )
    }

    // Hash password with higher salt rounds for security
    const saltRounds = 14
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: username,
        password: hashedPassword,
        type: role as "CONSUMER" | "CREATOR" | "ENTERPRISE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
      }
    })

    // Send verification email
    try {
      const verificationToken = await createVerificationToken(user.id, user.email)
      await sendVerificationEmail(user.email, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails, just log it
    }

    // If user is a creator, create creator profile
    if (role === "CREATOR") {
      await prisma.creatorProfile.create({
        data: {
          userId: user.id,
          displayName: sanitizedDisplayName,
          bio: `${sanitizedDisplayName}'s AI models and solutions`,
          verified: false,
          rating: 0,
          totalEarnings: 0,
          totalDownloads: 0,
          createdAt: new Date(),
        }
      })
    }

    // Log successful registration (without sensitive data)
    console.log(`New user registered: ${user.email} (${user.type})`)

    return NextResponse.json({
      user,
      message: "Account created successfully. Please check your email to verify your account.",
      requiresVerification: true
    }, { status: 201 })

  } catch (error) {
    console.error("Registration error:", error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: "Account with this email already exists" },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}

// Export with rate limiting
export const POST = withRateLimit(rateLimiters.registration, registerHandler) 