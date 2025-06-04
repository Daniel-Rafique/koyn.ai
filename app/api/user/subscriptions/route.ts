import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { helioPaymentHandler } from '@/lib/helio-payment-handler'

// GET - Fetch user subscriptions
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
        plan: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                creatorId: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.subscription.count({
      where: whereClause
    })

    // Calculate summary statistics
    const summary = await prisma.subscription.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
      _count: {
        status: true
      }
    })

    const summaryStats = summary.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + subscriptions.length < totalCount
        },
        summary: {
          total: totalCount,
          active: summaryStats.active || 0,
          cancelled: summaryStats.cancelled || 0,
          expired: summaryStats.expired || 0,
          past_due: summaryStats.past_due || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

// POST - Manage subscription actions (cancel, pause, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, subscriptionId, reason } = body

    if (!action || !subscriptionId) {
      return NextResponse.json(
        { error: 'Action and subscriptionId are required' },
        { status: 400 }
      )
    }

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          include: {
            model: {
              select: {
                id: true,
                name: true
              }
            }
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

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    switch (action) {
      case 'cancel':
        if (subscription.status === 'CANCELLED' || subscription.status === 'EXPIRED') {
          return NextResponse.json(
            { error: 'Subscription is already cancelled or expired' },
            { status: 400 }
          )
        }

        // Cancel subscription
        const cancelledSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        })

        // Log cancellation
        console.log(`Subscription cancelled: ${subscriptionId} by user ${session.user.id}, reason: ${reason}`)

        return NextResponse.json({
          success: true,
          data: { subscription: cancelledSubscription },
          message: `Subscription to ${subscription.plan.model.name} cancelled successfully. You'll retain access until ${subscription.currentPeriodEnd}`
        })

      case 'reactivate':
        if (subscription.status !== 'CANCELLED') {
          return NextResponse.json(
            { error: 'Only cancelled subscriptions can be reactivated' },
            { status: 400 }
          )
        }

        // Check if subscription can be reactivated (not expired)
        if (new Date() > subscription.currentPeriodEnd) {
          return NextResponse.json(
            { error: 'Cannot reactivate expired subscription. Please purchase a new subscription.' },
            { status: 400 }
          )
        }

        // Reactivate subscription
        const reactivatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'ACTIVE',
            updatedAt: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          data: { subscription: reactivatedSubscription },
          message: 'Subscription reactivated successfully'
        })

      case 'check_access':
        // Check if user still has access to the model
        const accessResult = await helioPaymentHandler.checkUserAccess(
          session.user.id, 
          subscription.plan.model.id
        )

        return NextResponse.json({
          success: true,
          data: {
            hasAccess: accessResult.hasAccess,
            subscription: accessResult.subscription,
            expiresAt: accessResult.expiresAt,
            model: subscription.plan.model
          }
        })

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  }
} 