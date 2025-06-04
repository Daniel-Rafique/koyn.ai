import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { helioService } from '@/lib/helio'
import { validateRequest, paymentSchemas, sanitizers, securityValidation } from '@/lib/validation'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Fetch user's subscriptions with detailed info
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
    const status = searchParams.get('status') // active, cancelled, expired, all
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const whereClause: Record<string, unknown> = {
      userId: session.user.id
    }

    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase()
    }

    // Fetch subscriptions with related data
    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        model: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            category: true,
            creator: {
              select: {
                id: true,
                displayName: true,
                verified: true
              }
            }
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            unit: true,
            features: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Calculate subscription analytics
    const analytics = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'ACTIVE').length,
      totalSpent: subscriptions.reduce((sum, s) => sum + s.plan.price, 0),
      expiringThisWeek: subscriptions.filter(s => {
        const weekFromNow = new Date()
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return s.status === 'ACTIVE' && s.currentPeriodEnd <= weekFromNow
      }).length
    }

    // Get total count for pagination
    const totalCount = await prisma.subscription.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        analytics,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + subscriptions.length < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

// POST - Create new subscription
async function createSubscriptionHandler(request: NextRequest) {
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
    const validation = validateRequest(paymentSchemas.subscription)(body)
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

    const { modelId, planId, paymentMethod, walletAddress, duration } = validation.data

    // Security checks
    if (securityValidation.hasSQLInjection(modelId) || securityValidation.hasSQLInjection(planId)) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }

    // Check if model exists and is published
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      include: {
        pricing: {
          where: { 
            id: planId,
            active: true 
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            verified: true
          }
        }
      }
    })

    if (!model || model.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Model not found or not available' },
        { status: 404 }
      )
    }

    const plan = model.pricing[0]
    if (!plan) {
      return NextResponse.json(
        { error: 'Pricing plan not found or not active' },
        { status: 404 }
      )
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        modelId,
        status: 'ACTIVE'
      }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { 
          error: 'You already have an active subscription for this model',
          existingSubscription: {
            id: existingSubscription.id,
            expiresAt: existingSubscription.currentPeriodEnd
          }
        },
        { status: 409 }
      )
    }

    // Calculate subscription period
    const now = new Date()
    const periodEnd = calculatePeriodEnd(now, duration)
    const finalPrice = calculatePriceForDuration(plan.price, duration)

    // For crypto payments, create Helio payment link
    if (paymentMethod === 'crypto') {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true, name: true }
        })

        // Create Helio payment link using the correct service method
        const paymentResponse = await helioService.createModelPayment(
          modelId,
          {
            id: plan.id,
            modelId: modelId,
            name: plan.name,
            description: `${duration} access to ${model.name}`,
            pricePerUnit: finalPrice,
            unit: 'MONTHLY' as any, // Using enum value
            currency: 'USDC',
            features: plan.features,
            isPopular: false
          },
          session.user.id,
          user?.email || undefined,
          {
            duration,
            modelName: model.name,
            planName: plan.name,
            creatorId: model.creator.id,
            walletAddress: walletAddress,
            subscriptionType: 'model_access',
            periodEnd: periodEnd.toISOString()
          }
        )

        // Create pending subscription that will be activated by webhook
        const subscription = await prisma.subscription.create({
          data: {
            userId: session.user.id,
            modelId,
            planId,
            status: 'ACTIVE', // Start as active, webhook will update if needed
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            helioTransactionId: paymentResponse.paylinkId || paymentResponse.id
          },
          include: {
            model: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                unit: true
              }
            }
          }
        })

        return NextResponse.json({
          success: true,
          data: {
            subscription,
            payment: {
              method: 'crypto',
              url: paymentResponse.url,
              amount: finalPrice,
              currency: 'USDC',
              duration,
              paylinkId: paymentResponse.paylinkId || paymentResponse.id,
              instructions: 'Complete the crypto payment to activate your subscription. Your access will begin immediately after payment confirmation.'
            }
          },
          message: 'Payment link created. Complete payment to activate subscription.'
        }, { status: 201 })

      } catch (helioError) {
        console.error('Helio payment error:', helioError)
        return NextResponse.json(
          { error: 'Failed to create crypto payment link' },
          { status: 500 }
        )
      }
    }

    // For other payment methods (future implementation)
    return NextResponse.json(
      { error: 'Payment method not yet supported' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculatePeriodEnd(start: Date, duration: string): Date {
  const end = new Date(start)
  
  switch (duration) {
    case 'hour':
      end.setHours(end.getHours() + 1)
      break
    case 'day':
      end.setDate(end.getDate() + 1)
      break
    case 'week':
      end.setDate(end.getDate() + 7)
      break
    case 'month':
      end.setMonth(end.getMonth() + 1)
      break
    default:
      end.setDate(end.getDate() + 1) // Default to 1 day
  }
  
  return end
}

function calculatePriceForDuration(basePrice: number, duration: string): number {
  // Flexible pricing based on our model - the base price can be adjusted per duration
  switch (duration) {
    case 'hour':
      return Math.max(2, basePrice * 0.05) // $2 minimum for hourly
    case 'day':
      return Math.max(8, basePrice * 0.1) // $8 minimum for daily  
    case 'week':
      return Math.max(30, basePrice * 0.3) // $30 minimum for weekly
    case 'month':
      return Math.max(100, basePrice) // $100 minimum for monthly
    default:
      return basePrice
  }
}

// Export with rate limiting
export const POST = withRateLimit(rateLimiters.general, createSubscriptionHandler)