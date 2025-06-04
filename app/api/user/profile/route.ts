import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { validateRequest, userSchemas, sanitizers, securityValidation } from '@/lib/validation'

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        type: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            subscriptions: true,
            orders: true,
            reviews: true
          }
        },
        // Include creator profile if user is a creator
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            website: true,
            verified: true,
            rating: true,
            totalEarnings: true,
            totalDownloads: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          subscriptions: user._count.subscriptions,
          orders: user._count.orders,
          reviews: user._count.reviews
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validation = validateRequest(userSchemas.updateProfile)(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { name, avatar, bio, website } = validation.data

    // Security checks
    if (name && (securityValidation.hasSQLInjection(name) || securityValidation.hasXSS(name))) {
      return NextResponse.json(
        { error: 'Invalid input detected in name' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedName = name ? sanitizers.html(name) : undefined
    const sanitizedBio = bio ? sanitizers.html(bio) : undefined

    // Check if username is already taken (if being changed)
    if (name) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          name: sanitizedName,
          NOT: { id: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    // Update user
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (sanitizedName) updateData.name = sanitizedName
    if (avatar) updateData.avatar = avatar

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        type: true,
        updatedAt: true
      }
    })

    // If user is a creator and provided creator-specific data, update creator profile
    if ((bio || website) && updatedUser.type === 'CREATOR') {
      const creatorUpdateData: Record<string, unknown> = {}
      
      if (sanitizedBio) creatorUpdateData.bio = sanitizedBio
      if (website) creatorUpdateData.website = website

      if (Object.keys(creatorUpdateData).length > 0) {
        await prisma.creatorProfile.upsert({
          where: { userId: session.user.id },
          update: creatorUpdateData,
          create: {
            userId: session.user.id,
            displayName: updatedUser.name || 'Creator',
            bio: sanitizedBio || `${updatedUser.name}'s AI models and solutions`,
            website: website || null,
            verified: false,
            rating: 0,
            totalEarnings: 0,
            totalDownloads: 0
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 