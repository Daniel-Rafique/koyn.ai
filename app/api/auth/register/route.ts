import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/database"
import { withRateLimit, rateLimiters } from "@/lib/rate-limit"
import { validateRequest, userSchemas, sanitizers, securityValidation } from "@/lib/validation"
import { createVerificationToken, sendVerificationEmail } from "@/lib/email-verification"

// Add debug logging helper
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[REGISTER DEBUG] ${message}`, data ? data : '')
  }
}

async function registerHandler(request: NextRequest) {
  try {
    const body = await request.json()
    debugLog("Registration request", { email: body.email, username: body.username })
    
    // Validate request data using our schema
    const validation = validateRequest(userSchemas.register)(body)
    if (!validation.success) {
      debugLog("Validation failed", validation.errors.issues)
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
    debugLog("Validated data", { email, username, role })

    // Security checks
    if (securityValidation.hasSQLInjection(email) || 
        securityValidation.hasSQLInjection(username) ||
        securityValidation.hasXSS(email) || 
        securityValidation.hasXSS(username)) {
      debugLog("Security validation failed")
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
      debugLog("User already exists", { email })
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
      debugLog("Username already taken", { username })
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      )
    }

    // Hash password with higher salt rounds for security
    const saltRounds = 14
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    debugLog("Password hashed successfully")

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
    debugLog("User created successfully", { id: user.id, email: user.email })

    // Send verification email
    try {
      const verificationToken = await createVerificationToken(user.id, user.email)
      await sendVerificationEmail(user.email, verificationToken)
      debugLog("Verification email sent", { email: user.email })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      debugLog("Failed to send verification email", { error: (emailError as Error).message })
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
      debugLog("Creator profile created", { userId: user.id })
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
    debugLog("Registration error", { message: (error as Error).message })
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(rateLimiters.auth, registerHandler) 