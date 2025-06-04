import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Get user's usage statistics
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
    const period = searchParams.get('period') || 'month' // hour, day, week, month, year
    const limit = parseInt(searchParams.get('limit') || '30')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Calculate date range based on period
    const now = new Date()
    const dateRange = getDateRange(period, now)

    // Build where clause
    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
      date: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }

    if (modelId) {
      whereClause.modelId = modelId
    }

    // Get detailed usage stats
    const [usageStats, totalStats, modelBreakdown] = await Promise.all([
      // Detailed usage over time
      getUsageOverTime(whereClause, period, limit, offset),
      
      // Total aggregated stats
      prisma.usageStats.aggregate({
        where: whereClause,
        _sum: {
          requestCount: true,
          tokenCount: true,
          cost: true
        },
        _avg: {
          responseTime: true
        },
        _count: {
          id: true
        }
      }),

      // Breakdown by model (if not filtering by specific model)
      !modelId ? getModelBreakdown(session.user.id, dateRange) : null
    ])

    // Get current limits for active subscriptions
    const activeLimits = await getActiveLimits(session.user.id, modelId)

    // Calculate usage efficiency metrics
    const efficiency = calculateEfficiencyMetrics(usageStats, totalStats)

    return NextResponse.json({
      success: true,
      data: {
        period: {
          type: period,
          start: dateRange.start,
          end: dateRange.end
        },
        totals: {
          requests: totalStats._sum.requestCount || 0,
          tokens: totalStats._sum.tokenCount || 0,
          cost: Math.round((totalStats._sum.cost || 0) * 100) / 100,
          averageResponseTime: Math.round(totalStats._avg.responseTime || 0),
          sessions: totalStats._count.id || 0
        },
        timeline: usageStats,
        modelBreakdown,
        limits: activeLimits,
        efficiency,
        pagination: {
          limit,
          offset,
          hasMore: usageStats.length === limit
        }
      }
    })

  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}

// Helper function to get date range based on period
function getDateRange(period: string, now: Date) {
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'hour':
      start.setHours(now.getHours() - 1)
      break
    case 'day':
      start.setDate(now.getDate() - 1)
      break
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
    default:
      start.setMonth(now.getMonth() - 1) // Default to month
  }

  return { start, end }
}

// Helper function to get usage over time with appropriate grouping
async function getUsageOverTime(whereClause: Record<string, unknown>, period: string, limit: number, offset: number) {
  // Group by time intervals based on period
  const groupByInterval = getGroupByInterval(period)
  
  const usageData = await prisma.usageStats.groupBy({
    by: ['date'],
    where: whereClause,
    _sum: {
      requestCount: true,
      tokenCount: true,
      cost: true
    },
    _avg: {
      responseTime: true
    },
    _count: {
      id: true
    },
    orderBy: {
      date: 'desc'
    },
    take: limit,
    skip: offset
  })

  // Format the data for easier consumption
  return usageData.map(item => ({
    date: item.date,
    requests: item._sum.requestCount || 0,
    tokens: item._sum.tokenCount || 0,
    cost: Math.round((item._sum.cost || 0) * 100) / 100,
    averageResponseTime: Math.round(item._avg.responseTime || 0),
    sessions: item._count.id || 0
  }))
}

// Helper function to get grouping interval
function getGroupByInterval(period: string) {
  switch (period) {
    case 'hour':
      return 'minute'
    case 'day':
      return 'hour'
    case 'week':
    case 'month':
      return 'day'
    case 'year':
      return 'month'
    default:
      return 'day'
  }
}

// Helper function to get model breakdown
async function getModelBreakdown(userId: string, dateRange: { start: Date; end: Date }) {
  const modelStats = await prisma.usageStats.groupBy({
    by: ['modelId'],
    where: {
      userId,
      date: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _sum: {
      requestCount: true,
      tokenCount: true,
      cost: true
    },
    _avg: {
      responseTime: true
    },
    orderBy: {
      _sum: {
        requestCount: 'desc'
      }
    },
    take: 10 // Top 10 models
  })

  // Get model details for each model in the breakdown
  const modelIds = modelStats.map(stat => stat.modelId).filter(Boolean) as string[]
  const models = await prisma.model.findMany({
    where: {
      id: { in: modelIds }
    },
    select: {
      id: true,
      name: true,
      category: true,
      creator: {
        select: {
          displayName: true
        }
      }
    }
  })

  // Combine stats with model details
  return modelStats.map(stat => {
    const model = models.find(m => m.id === stat.modelId)
    return {
      model: model ? {
        id: model.id,
        name: model.name,
        category: model.category,
        creator: model.creator.displayName
      } : null,
      stats: {
        requests: stat._sum.requestCount || 0,
        tokens: stat._sum.tokenCount || 0,
        cost: Math.round((stat._sum.cost || 0) * 100) / 100,
        averageResponseTime: Math.round(stat._avg.responseTime || 0)
      }
    }
  }).filter(item => item.model) // Only include items where we found the model
}

// Helper function to get active limits
async function getActiveLimits(userId: string, modelId?: string | null) {
  const whereClause: Record<string, unknown> = {
    userId,
    status: 'ACTIVE',
    currentPeriodEnd: {
      gt: new Date()
    }
  }

  if (modelId) {
    whereClause.modelId = modelId
  }

  const subscriptions = await prisma.subscription.findMany({
    where: whereClause,
    include: {
      plan: {
        select: {
          requestsPerMonth: true,
          requestsPerMinute: true
        }
      },
      model: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return subscriptions.map(sub => ({
    modelId: sub.modelId,
    modelName: sub.model.name,
    limits: {
      monthlyRequests: sub.plan.requestsPerMonth,
      minuteRequests: sub.plan.requestsPerMinute
    },
    expiresAt: sub.currentPeriodEnd
  }))
}

// Helper function to calculate efficiency metrics
function calculateEfficiencyMetrics(usageStats: any[], totalStats: any) {
  const totalRequests = totalStats._sum.requestCount || 0
  const totalCost = totalStats._sum.cost || 0
  const avgResponseTime = totalStats._avg.responseTime || 0

  return {
    costPerRequest: totalRequests > 0 ? Math.round((totalCost / totalRequests) * 100000) / 100000 : 0,
    requestsPerDay: usageStats.length > 0 ? Math.round(totalRequests / usageStats.length) : 0,
    averageResponseTime: Math.round(avgResponseTime),
    efficiency: avgResponseTime > 0 && totalCost > 0 
      ? Math.round((totalRequests / (avgResponseTime * totalCost)) * 100) / 100 
      : 0
  }
}

// POST - Get comparative usage analysis
async function getUsageAnalysisHandler(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { modelIds, comparePeriods, metrics = ['requests', 'cost', 'responseTime'] } = body

    if (!Array.isArray(modelIds) || modelIds.length === 0) {
      return NextResponse.json(
        { error: 'modelIds array is required' },
        { status: 400 }
      )
    }

    // Get usage data for comparison
    const comparisonData = await Promise.all(
      modelIds.map(async (modelId: string) => {
        const model = await prisma.model.findUnique({
          where: { id: modelId },
          select: { id: true, name: true, category: true }
        })

        if (!model) return null

        const stats = await prisma.usageStats.aggregate({
          where: {
            userId: session.user.id,
            modelId,
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          _sum: {
            requestCount: true,
            tokenCount: true,
            cost: true
          },
          _avg: {
            responseTime: true
          }
        })

        return {
          model,
          usage: {
            requests: stats._sum.requestCount || 0,
            tokens: stats._sum.tokenCount || 0,
            cost: Math.round((stats._sum.cost || 0) * 100) / 100,
            averageResponseTime: Math.round(stats._avg.responseTime || 0)
          }
        }
      })
    )

    const validData = comparisonData.filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        comparison: validData,
        insights: generateUsageInsights(validData)
      }
    })

  } catch (error) {
    console.error('Error generating usage analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate usage analysis' },
      { status: 500 }
    )
  }
}

// Helper function to generate insights
function generateUsageInsights(data: any[]) {
  if (data.length === 0) return []

  const insights = []

  // Find most used model
  const mostUsed = data.reduce((prev, current) => 
    (prev.usage.requests > current.usage.requests) ? prev : current
  )
  insights.push({
    type: 'most_used',
    message: `${mostUsed.model.name} is your most frequently used model with ${mostUsed.usage.requests} requests`
  })

  // Find most expensive model
  const mostExpensive = data.reduce((prev, current) => 
    (prev.usage.cost > current.usage.cost) ? prev : current
  )
  if (mostExpensive.usage.cost > 0) {
    insights.push({
      type: 'cost_analysis',
      message: `${mostExpensive.model.name} accounts for the highest costs at $${mostExpensive.usage.cost}`
    })
  }

  // Find fastest model
  const fastest = data.reduce((prev, current) => 
    (prev.usage.averageResponseTime < current.usage.averageResponseTime) ? prev : current
  )
  if (fastest.usage.averageResponseTime > 0) {
    insights.push({
      type: 'performance',
      message: `${fastest.model.name} has the best response time at ${fastest.usage.averageResponseTime}ms`
    })
  }

  return insights
}

// Export with rate limiting
export const POST = withRateLimit(rateLimiters.general, getUsageAnalysisHandler) 