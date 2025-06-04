import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Get creator analytics and insights
async function getCreatorAnalyticsHandler(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is a creator
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        verified: true,
        totalEarnings: true,
        createdAt: true
      }
    })

    if (!creatorProfile) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const modelId = searchParams.get('modelId')

    // Calculate date range
    const now = new Date()
    let startDate = new Date(now)
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // Build where clause for creator's models
    const modelWhere: any = {
      creatorId: session.user.id
    }
    if (modelId) {
      modelWhere.id = modelId
    }

    // Get creator's models
    const creatorModels = await prisma.model.findMany({
      where: modelWhere,
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        downloadCount: true,
        apiCallCount: true,
        createdAt: true
      }
    })

    const modelIds = creatorModels.map(m => m.id)

    if (modelIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalModels: 0,
            publishedModels: 0,
            totalEarnings: 0,
            totalUsers: 0,
            totalUsage: 0
          },
          models: [],
          analytics: {
            usage: { totalRequests: 0, totalRevenue: 0 },
            subscriptions: { total: 0, active: 0 },
            trends: { requests: 0, revenue: 0 }
          },
          insights: []
        }
      })
    }

    // Get usage analytics
    const [usageStats, subscriptionStats, revenueStats] = await Promise.all([
      // Usage statistics
      prisma.usageStats.aggregate({
        where: {
          modelId: { in: modelIds },
          date: { gte: startDate, lte: now }
        },
        _sum: {
          requestCount: true,
          tokenCount: true,
          cost: true
        },
        _avg: {
          responseTime: true
        }
      }),

      // Subscription statistics
      prisma.subscription.groupBy({
        by: ['status'],
        where: {
          modelId: { in: modelIds },
          createdAt: { gte: startDate, lte: now }
        },
        _count: {
          id: true
        }
      }),

      // Revenue by model
      prisma.usageStats.groupBy({
        by: ['modelId'],
        where: {
          modelId: { in: modelIds },
          date: { gte: startDate, lte: now }
        },
        _sum: {
          cost: true,
          requestCount: true
        }
      })
    ])

    // Get unique users
    const uniqueUsers = await prisma.subscription.findMany({
      where: {
        modelId: { in: modelIds },
        createdAt: { gte: startDate, lte: now }
      },
      select: { userId: true },
      distinct: ['userId']
    })

    // Process subscription stats
    const subscriptionSummary = {
      total: subscriptionStats.reduce((sum, stat) => sum + stat._count.id, 0),
      active: subscriptionStats.find(stat => stat.status === 'ACTIVE')?._count.id || 0,
      cancelled: subscriptionStats.find(stat => stat.status === 'CANCELLED')?._count.id || 0
    }

    // Process revenue stats by model
    const modelAnalytics = revenueStats.map(stat => {
      const model = creatorModels.find(m => m.id === stat.modelId)
      return {
        modelId: stat.modelId,
        modelName: model?.name || 'Unknown',
        requests: stat._sum.requestCount || 0,
        revenue: Math.round((stat._sum.cost || 0) * 0.8 * 100) / 100 // 80% to creator
      }
    })

    // Calculate growth trends (simple version)
    const previousStartDate = new Date(startDate)
    const previousEndDate = new Date(startDate)
    switch (period) {
      case 'week':
        previousStartDate.setDate(previousStartDate.getDate() - 7)
        break
      case 'quarter':
        previousStartDate.setMonth(previousStartDate.getMonth() - 3)
        break
      case 'year':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1)
        break
      default:
        previousStartDate.setMonth(previousStartDate.getMonth() - 1)
    }

    const previousUsage = await prisma.usageStats.aggregate({
      where: {
        modelId: { in: modelIds },
        date: { gte: previousStartDate, lt: previousEndDate }
      },
      _sum: {
        requestCount: true,
        cost: true
      }
    })

    const currentRequests = usageStats._sum.requestCount || 0
    const previousRequests = previousUsage._sum.requestCount || 0
    const currentRevenue = (usageStats._sum.cost || 0) * 0.8
    const previousRevenue = (previousUsage._sum.cost || 0) * 0.8

    const requestsTrend = previousRequests > 0 
      ? Math.round(((currentRequests - previousRequests) / previousRequests) * 100)
      : currentRequests > 0 ? 100 : 0

    const revenueTrend = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0

    // Generate insights
    const insights = []
    if (requestsTrend > 20) {
      insights.push({
        type: 'growth',
        title: 'Strong Growth',
        message: `Usage increased by ${requestsTrend}% this ${period}`,
        action: 'Consider scaling your infrastructure'
      })
    }

    if (currentRevenue > 100) {
      insights.push({
        type: 'revenue',
        title: 'Revenue Milestone',
        message: `Earned $${Math.round(currentRevenue * 100) / 100} this ${period}`,
        action: 'Great work! Keep creating quality models'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalModels: creatorModels.length,
          publishedModels: creatorModels.filter(m => m.status === 'PUBLISHED').length,
          totalEarnings: Math.round(creatorProfile.totalEarnings * 100) / 100,
          totalUsers: uniqueUsers.length,
          totalUsage: currentRequests,
          period: {
            type: period,
            start: startDate,
            end: now
          }
        },
        models: creatorModels.map(model => {
          const analytics = modelAnalytics.find(a => a.modelId === model.id)
          return {
            ...model,
            analytics: {
              requests: analytics?.requests || 0,
              revenue: analytics?.revenue || 0
            }
          }
        }),
        analytics: {
          usage: {
            totalRequests: currentRequests,
            totalTokens: usageStats._sum.tokenCount || 0,
            totalRevenue: Math.round(currentRevenue * 100) / 100,
            averageResponseTime: Math.round(usageStats._avg.responseTime || 0)
          },
          subscriptions: subscriptionSummary,
          trends: {
            requests: requestsTrend,
            revenue: revenueTrend
          },
          topModels: modelAnalytics
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
        },
        insights
      }
    })

  } catch (error) {
    console.error('Error fetching creator analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator analytics' },
      { status: 500 }
    )
  }
}

// Export with rate limiting
export const GET = withRateLimit(rateLimiters.general, getCreatorAnalyticsHandler) 