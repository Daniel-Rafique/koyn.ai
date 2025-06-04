import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Check user's access to models
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')
    const modelIds = searchParams.get('modelIds')?.split(',')

    // If checking specific model
    if (modelId) {
      const hasAccess = await checkModelAccess(session.user.id, modelId)
      return NextResponse.json({
        success: true,
        data: {
          modelId,
          hasAccess: hasAccess.hasAccess,
          subscription: hasAccess.subscription,
          expiresAt: hasAccess.expiresAt
        }
      })
    }

    // If checking multiple models
    if (modelIds && modelIds.length > 0) {
      const accessChecks = await Promise.all(
        modelIds.map(async (id) => {
          const access = await checkModelAccess(session.user.id, id)
          return {
            modelId: id,
            hasAccess: access.hasAccess,
            expiresAt: access.expiresAt
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: { access: accessChecks }
      })
    }

    // Get all user's active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        currentPeriodEnd: {
          gt: new Date()
        }
      },
      include: {
        model: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
            features: true
          }
        }
      },
      orderBy: { currentPeriodEnd: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        activeSubscriptions,
        summary: {
          totalActive: activeSubscriptions.length,
          totalModelsWithAccess: activeSubscriptions.length,
          expiringThisWeek: activeSubscriptions.filter(sub => {
            const weekFromNow = new Date()
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            return sub.currentPeriodEnd <= weekFromNow
          }).length
        }
      }
    })

  } catch (error) {
    console.error('Error checking user access:', error)
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    )
  }
}

// POST - Check access for model inference (used by inference endpoints)
async function checkAccessHandler(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { modelId, operation = 'inference' } = body

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      )
    }

    const accessCheck = await checkModelAccess(session.user.id, modelId)

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { 
          error: 'Access denied',
          message: 'You need an active subscription to access this model',
          modelId,
          suggestedAction: 'Purchase a subscription to access this model'
        },
        { status: 403 }
      )
    }

    // For inference operations, also check rate limits based on plan
    if (operation === 'inference' && accessCheck.subscription) {
      const usage = await getModelUsage(session.user.id, modelId)
      const limits = accessCheck.subscription.plan

      // Check monthly limits
      if (limits.requestsPerMonth && usage.monthlyRequests >= limits.requestsPerMonth) {
        return NextResponse.json(
          {
            error: 'Monthly limit exceeded',
            message: `You have exceeded your monthly limit of ${limits.requestsPerMonth} requests`,
            usage: {
              monthly: usage.monthlyRequests,
              limit: limits.requestsPerMonth
            }
          },
          { status: 429 }
        )
      }

      // Check per-minute limits
      if (limits.requestsPerMinute && usage.minuteRequests >= limits.requestsPerMinute) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `You have exceeded your rate limit of ${limits.requestsPerMinute} requests per minute`,
            usage: {
              minute: usage.minuteRequests,
              limit: limits.requestsPerMinute
            }
          },
          { status: 429 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasAccess: true,
        subscription: accessCheck.subscription,
        expiresAt: accessCheck.expiresAt,
        usage: operation === 'inference' ? await getModelUsage(session.user.id, modelId) : undefined
      }
    })

  } catch (error) {
    console.error('Error checking access:', error)
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    )
  }
}

// Helper function to check if user has access to a specific model
async function checkModelAccess(userId: string, modelId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      modelId,
      status: 'ACTIVE',
      currentPeriodEnd: {
        gt: new Date()
      }
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          unit: true,
          features: true,
          requestsPerMonth: true,
          requestsPerMinute: true
        }
      }
    },
    orderBy: { currentPeriodEnd: 'desc' }
  })

  return {
    hasAccess: !!subscription,
    subscription,
    expiresAt: subscription?.currentPeriodEnd
  }
}

// Helper function to get current usage for a user and model
async function getModelUsage(userId: string, modelId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfMinute = new Date(now.getTime() - 60000) // Last minute

  // Get usage stats from database
  const monthlyUsage = await prisma.usageStats.aggregate({
    where: {
      userId,
      modelId,
      date: {
        gte: startOfMonth
      }
    },
    _sum: {
      requestCount: true,
      tokenCount: true
    }
  })

  const minuteUsage = await prisma.usageStats.aggregate({
    where: {
      userId,
      modelId,
      date: {
        gte: startOfMinute
      }
    },
    _sum: {
      requestCount: true
    }
  })

  return {
    monthlyRequests: monthlyUsage._sum.requestCount || 0,
    monthlyTokens: monthlyUsage._sum.tokenCount || 0,
    minuteRequests: minuteUsage._sum.requestCount || 0
  }
}

// Export with rate limiting
export const POST = withRateLimit(rateLimiters.general, checkAccessHandler) 