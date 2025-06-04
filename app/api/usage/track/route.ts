import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { validateRequest, securityValidation } from '@/lib/validation'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { z } from 'zod'

// Usage tracking schema
const usageTrackingSchema = z.object({
  modelId: z.string().uuid('Invalid model ID'),
  operation: z.enum(['inference', 'download', 'view']),
  tokensUsed: z.number().int().min(0).optional(),
  responseTime: z.number().int().min(0).optional(),
  success: z.boolean(),
  errorType: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// POST - Track usage event
async function trackUsageHandler(request: NextRequest) {
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
    const validation = validateRequest(usageTrackingSchema)(body)
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

    const { modelId, operation, tokensUsed, responseTime, success, errorType, metadata } = validation.data

    // Security checks
    if (securityValidation.hasSQLInjection(modelId)) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }

    // Verify model exists and user has access
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { 
        id: true, 
        name: true, 
        status: true,
        creator: {
          select: { id: true }
        }
      }
    })

    if (!model || model.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Model not found or not available' },
        { status: 404 }
      )
    }

    // For inference operations, verify user has active subscription
    if (operation === 'inference') {
      const hasAccess = await checkUserAccess(session.user.id, modelId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied - active subscription required' },
          { status: 403 }
        )
      }
    }

    const now = new Date()
    
    // Calculate cost based on tokens and operation
    const cost = calculateUsageCost(operation, tokensUsed || 0, responseTime || 0)

    // Record usage in database
    const usageRecord = await prisma.usageStats.create({
      data: {
        userId: session.user.id,
        modelId,
        date: now,
        requestCount: 1,
        tokenCount: tokensUsed || 0,
        cost,
        responseTime: responseTime || 0,
        // Store additional metadata
        ...(metadata && { 
          // We'll need to add these fields to the schema or use a JSON field
        })
      }
    })

    // Update model statistics
    await updateModelStats(modelId, operation, success)

    // Update creator earnings if this was a paid operation
    if (operation === 'inference' && success) {
      await updateCreatorEarnings(model.creator.id, modelId, cost)
    }

    // Check if user is approaching their limits
    const usageLimits = await checkUsageLimits(session.user.id, modelId)

    return NextResponse.json({
      success: true,
      data: {
        usageId: usageRecord.id,
        timestamp: now,
        cost,
        limits: usageLimits
      },
      message: 'Usage tracked successfully'
    })

  } catch (error) {
    console.error('Error tracking usage:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}

// Helper function to check user access
async function checkUserAccess(userId: string, modelId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      modelId,
      status: 'ACTIVE',
      currentPeriodEnd: {
        gt: new Date()
      }
    }
  })

  return !!subscription
}

// Helper function to calculate usage cost
function calculateUsageCost(operation: string, tokens: number, responseTime: number): number {
  switch (operation) {
    case 'inference':
      // Base cost: $0.001 per 1000 tokens, plus time premium
      const tokenCost = (tokens / 1000) * 0.001
      const timePremium = (responseTime / 1000) * 0.0001 // $0.0001 per second
      return Math.round((tokenCost + timePremium) * 100000) / 100000 // Round to 5 decimal places
    case 'download':
      return 0.01 // Small cost for downloads
    case 'view':
      return 0 // Free to view
    default:
      return 0
  }
}

// Helper function to update model statistics
async function updateModelStats(modelId: string, operation: string, success: boolean) {
  const updateData: Record<string, unknown> = {}

  switch (operation) {
    case 'inference':
      updateData.apiCallCount = { increment: 1 }
      break
    case 'download':
      updateData.downloadCount = { increment: 1 }
      break
    case 'view':
      // Views are tracked separately, don't increment here
      break
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.model.update({
      where: { id: modelId },
      data: updateData
    })
  }
}

// Helper function to update creator earnings
async function updateCreatorEarnings(creatorId: string, modelId: string, amount: number) {
  if (amount <= 0) return

  // Platform takes 20% fee, creator gets 80%
  const platformFee = amount * 0.2
  const creatorEarning = amount * 0.8

  // Update creator profile earnings
  await prisma.creatorProfile.update({
    where: { id: creatorId },
    data: {
      totalEarnings: { increment: creatorEarning }
    }
  })

  // Could also create an earnings record for detailed tracking
  // This would require adding an Earnings table
}

// Helper function to check usage limits
async function checkUsageLimits(userId: string, modelId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfMinute = new Date(now.getTime() - 60000)

  // Get current usage
  const [monthlyUsage, minuteUsage, subscription] = await Promise.all([
    prisma.usageStats.aggregate({
      where: {
        userId,
        modelId,
        date: { gte: startOfMonth }
      },
      _sum: {
        requestCount: true,
        tokenCount: true,
        cost: true
      }
    }),
    prisma.usageStats.aggregate({
      where: {
        userId,
        modelId,
        date: { gte: startOfMinute }
      },
      _sum: {
        requestCount: true
      }
    }),
    prisma.subscription.findFirst({
      where: {
        userId,
        modelId,
        status: 'ACTIVE',
        currentPeriodEnd: { gt: now }
      },
      include: {
        plan: {
          select: {
            requestsPerMonth: true,
            requestsPerMinute: true
          }
        }
      }
    })
  ])

  const currentUsage = {
    monthlyRequests: monthlyUsage._sum.requestCount || 0,
    monthlyTokens: monthlyUsage._sum.tokenCount || 0,
    monthlyCost: monthlyUsage._sum.cost || 0,
    minuteRequests: minuteUsage._sum.requestCount || 0
  }

  const limits = subscription?.plan ? {
    monthlyRequestLimit: subscription.plan.requestsPerMonth,
    minuteRequestLimit: subscription.plan.requestsPerMinute
  } : null

  // Calculate percentage used
  const usage = {
    ...currentUsage,
    limits,
    monthlyRequestsUsage: limits?.monthlyRequestLimit 
      ? Math.round((currentUsage.monthlyRequests / limits.monthlyRequestLimit) * 100)
      : 0,
    minuteRequestsUsage: limits?.minuteRequestLimit
      ? Math.round((currentUsage.minuteRequests / limits.minuteRequestLimit) * 100)
      : 0,
    isNearLimit: limits ? (
      (limits.monthlyRequestLimit && currentUsage.monthlyRequests >= limits.monthlyRequestLimit * 0.8) ||
      (limits.minuteRequestLimit && currentUsage.minuteRequests >= limits.minuteRequestLimit * 0.8)
    ) : false
  }

  return usage
}

// Export with rate limiting
export const POST = withRateLimit(rateLimiters.general, trackUsageHandler) 