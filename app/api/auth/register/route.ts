import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/database"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  displayName: z.string().min(1, "Display name is required").max(100, "Display name too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  role: z.enum(["CONSUMER", "CREATOR"]),
  subscribeNewsletter: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { email, username, displayName, password, role, subscribeNewsletter } = validationResult.data

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

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: username, // Using 'name' field from schema
        password: hashedPassword,
        type: role as any, // Converting to UserType enum
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

    // If user is a creator, create creator profile
    if (role === "CREATOR") {
      await prisma.creatorProfile.create({
        data: {
          userId: user.id,
          displayName: displayName,
          bio: `${displayName}'s AI models and solutions`,
          verified: false,
          rating: 0,
          totalEarnings: 0,
          totalDownloads: 0,
          createdAt: new Date(),
        }
      })
    }

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, user.id)

    // Log successful registration
    console.log(`New user registered: ${user.email} (${user.type})`)

    return NextResponse.json(
      { 
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.name,
          role: user.type,
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 