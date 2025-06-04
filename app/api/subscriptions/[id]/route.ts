import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { helioService } from '@/lib/helio'

interface RouteParams {
  params: { id: string }
}

// GET - Get individual subscription details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Fetch subscription with related data
    const subscription = await prisma.subscription.findUnique({
      where: { 
        id,
        userId: session.user.id // Ensure user owns this subscription
      },
      include: {
        model: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            category: true,
            status: true,
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
            features: true,
            requestsPerMonth: true,
            requestsPerMinute: true
          }
        }
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Calculate subscription status and remaining time
    const now = new Date()
    const isActive = subscription.status === 'ACTIVE' && subscription.currentPeriodEnd > now
    const isExpired = subscription.currentPeriodEnd <= now
    const timeRemaining = subscription.currentPeriodEnd.getTime() - now.getTime()
    
    const statusInfo = {
      isActive,
      isExpired,
      daysRemaining: Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))),
      hoursRemaining: Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60))),
      expiresAt: subscription.currentPeriodEnd,
      canRenew: isExpired || timeRemaining < (24 * 60 * 60 * 1000) // Can renew if expired or expires within 24 hours
    }

    // Check Helio payment status if we have a transaction ID
    let paymentInfo = null
    if (subscription.helioTransactionId) {
      try {
        const helioStatus = await helioService.getPaymentStatus(subscription.helioTransactionId) as any
        paymentInfo = {
          transactionId: subscription.helioTransactionId,
          status: helioStatus.status,
          blockchainTx: helioStatus.transactionSignature
        }
      } catch (error) {
        console.warn('Could not fetch Helio payment status:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          statusInfo,
          paymentInfo
        }
      }
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

// POST - Renew subscription (only if expired or near expiry)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { duration = 'month' } = body

    // Get current subscription
    const currentSubscription = await prisma.subscription.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      include: {
        model: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        plan: true
      }
    })

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Check if model is still available
    if (currentSubscription.model.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This model is no longer available for subscription' },
        { status: 400 }
      )
    }

    const now = new Date()
    const timeRemaining = currentSubscription.currentPeriodEnd.getTime() - now.getTime()
    const canRenew = timeRemaining < (24 * 60 * 60 * 1000) // Can renew within 24 hours of expiry

    if (!canRenew) {
      return NextResponse.json(
        { 
          error: 'Cannot renew subscription yet. You can renew within 24 hours of expiry.',
          expiresAt: currentSubscription.currentPeriodEnd,
          timeRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)) + ' days'
        },
        { status: 400 }
      )
    }

    // Create new subscription (since we can't modify existing crypto payments)
    const finalPrice = calculatePriceForDuration(currentSubscription.plan.price, duration)
    const periodStart = currentSubscription.currentPeriodEnd > now ? currentSubscription.currentPeriodEnd : now
    const periodEnd = calculatePeriodEnd(periodStart, duration)

    // Create Helio payment for renewal
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true }
    })

    const paymentResponse = await helioService.createModelPayment(
      currentSubscription.model.id,
      {
        id: currentSubscription.plan.id,
        modelId: currentSubscription.model.id,
        name: `${currentSubscription.plan.name} - Renewal`,
        description: `${duration} renewal for ${currentSubscription.model.name}`,
        pricePerUnit: finalPrice,
        unit: 'MONTHLY' as any,
        currency: 'USDC',
        features: currentSubscription.plan.features,
        isPopular: false
      },
      session.user.id,
      user?.email || undefined,
      {
        duration,
        renewalFor: currentSubscription.id,
        modelName: currentSubscription.model.name,
        subscriptionType: 'renewal'
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        currentSubscription: {
          id: currentSubscription.id,
          expiresAt: currentSubscription.currentPeriodEnd
        },
        renewal: {
          url: paymentResponse.url,
          amount: finalPrice,
          currency: 'USDC',
          duration,
          paylinkId: paymentResponse.paylinkId || paymentResponse.id,
          willStartAt: periodStart,
          willEndAt: periodEnd
        }
      },
      message: 'Renewal payment link created. Complete payment to extend your subscription.'
    })

  } catch (error) {
    console.error('Error creating subscription renewal:', error)
    return NextResponse.json(
      { error: 'Failed to create renewal' },
      { status: 500 }
    )
  }
}

// Helper functions (same as in main subscriptions endpoint)
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
      end.setDate(end.getDate() + 1)
  }
  
  return end
}

function calculatePriceForDuration(basePrice: number, duration: string): number {
  switch (duration) {
    case 'hour':
      return Math.max(2, basePrice * 0.05)
    case 'day':
      return Math.max(8, basePrice * 0.1)
    case 'week':
      return Math.max(30, basePrice * 0.3)
    case 'month':
      return Math.max(100, basePrice)
    default:
      return basePrice
  }
} 