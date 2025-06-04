import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Get user's usage summary for dashboard
async function getUsageSummaryHandler(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    // Define time periods
    const timeRanges = {
      today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      thisWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      thisMonth: new Date(now.getFullYear(), now.getMonth(), 1),
      lastMinute: new Date(now.getTime() - 60 * 1000)
    }

    // Get usage summaries for different time periods
    const [
      todayUsage,
      weekUsage,
      monthUsage,
      minuteUsage,
      activeSubscriptions,
      totalSpending,
      recentActivity
    ] = await Promise.all([
      // Today's usage
      prisma.usageStats.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: timeRanges.today }
        },
        _sum: {
          requestCount: true,
          tokenCount: true,
          cost: true
        }
      }),

      // This week's usage
      prisma.usageStats.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: timeRanges.thisWeek }
        },
        _sum: {
          requestCount: true,
          tokenCount: true,
          cost: true
        }
      }),

      // This month's usage
      prisma.usageStats.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: timeRanges.thisMonth }
        },
        _sum: {
          requestCount: true,
          tokenCount: true,
          cost: true
        }
      }),

      // Last minute usage (for rate limiting display)
      prisma.usageStats.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: timeRanges.lastMinute }
        },
        _sum: {
          requestCount: true
        }
      }),

      // Active subscriptions with limits
      prisma.subscription.findMany({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
          currentPeriodEnd: { gt: now }
        },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          plan: {
            select: {
              name: true,
              requestsPerMonth: true,
              requestsPerMinute: true
            }
          }
        },
        orderBy: {
          currentPeriodEnd: 'asc'
        }
      }),

      // Total spending (all time)
      prisma.usageStats.aggregate({
        where: {
          userId: session.user.id
        },
        _sum: {
          cost: true,
          requestCount: true,
          tokenCount: true
        }
      }),

      // Recent activity (last 5 usage events)
      prisma.usageStats.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          model: {
            select: {
              name: true,
              category: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 5
      })
    ])

    // Calculate usage percentages and warnings
    const usageAnalysis = calculateUsageAnalysis(
      monthUsage,
      minuteUsage,
      activeSubscriptions
    )

    // Format recent activity
    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      modelName: activity.model?.name || 'Unknown Model',
      category: activity.model?.category || 'Unknown',
      requests: activity.requestCount,
      tokens: activity.tokenCount,
      cost: Math.round(activity.cost * 100) / 100,
      timestamp: activity.date,
      responseTime: activity.responseTime
    }))

    // Calculate trends (comparing current vs previous periods)
    const trends = await calculateUsageTrends(session.user.id, timeRanges)

    // Get alerts and notifications
    const alerts = generateUsageAlerts(usageAnalysis, activeSubscriptions)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          today: {
            requests: todayUsage._sum.requestCount || 0,
            tokens: todayUsage._sum.tokenCount || 0,
            cost: Math.round((todayUsage._sum.cost || 0) * 100) / 100
          },
          week: {
            requests: weekUsage._sum.requestCount || 0,
            tokens: weekUsage._sum.tokenCount || 0,
            cost: Math.round((weekUsage._sum.cost || 0) * 100) / 100
          },
          month: {
            requests: monthUsage._sum.requestCount || 0,
            tokens: monthUsage._sum.tokenCount || 0,
            cost: Math.round((monthUsage._sum.cost || 0) * 100) / 100
          },
          allTime: {
            requests: totalSpending._sum.requestCount || 0,
            tokens: totalSpending._sum.tokenCount || 0,
            cost: Math.round((totalSpending._sum.cost || 0) * 100) / 100
          }
        },
        subscriptions: {
          active: activeSubscriptions.length,
          details: activeSubscriptions.map(sub => ({
            id: sub.id,
            modelId: sub.modelId,
            modelName: sub.model.name,
            category: sub.model.category,
            planName: sub.plan.name,
            expiresAt: sub.currentPeriodEnd,
            limits: {
              monthlyRequests: sub.plan.requestsPerMonth,
              minuteRequests: sub.plan.requestsPerMinute
            },
            daysRemaining: Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }))
        },
        usage: usageAnalysis,
        trends,
        recentActivity: formattedActivity,
        alerts
      }
    })

  } catch (error) {
    console.error('Error fetching usage summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage summary' },
      { status: 500 }
    )
  }
}

// Helper function to calculate usage analysis
function calculateUsageAnalysis(monthUsage: any, minuteUsage: any, subscriptions: any[]) {
  const analysis = {
    monthlyStatus: 'normal' as 'normal' | 'warning' | 'critical',
    minuteStatus: 'normal' as 'normal' | 'warning' | 'critical',
    utilizationPercentages: [] as Array<{
      modelId: string
      modelName: string
      monthlyUsage: number
      minuteUsage: number
      isWarning: boolean
      isCritical: boolean
    }>
  }

  const monthlyRequests = monthUsage._sum.requestCount || 0
  const minuteRequests = minuteUsage._sum.requestCount || 0

  for (const subscription of subscriptions) {
    const monthlyLimit = subscription.plan.requestsPerMonth || 0
    const minuteLimit = subscription.plan.requestsPerMinute || 0

    const monthlyUsagePercent = monthlyLimit > 0 ? (monthlyRequests / monthlyLimit) * 100 : 0
    const minuteUsagePercent = minuteLimit > 0 ? (minuteRequests / minuteLimit) * 100 : 0

    const isWarning = monthlyUsagePercent >= 80 || minuteUsagePercent >= 80
    const isCritical = monthlyUsagePercent >= 95 || minuteUsagePercent >= 95

    analysis.utilizationPercentages.push({
      modelId: subscription.modelId,
      modelName: subscription.model.name,
      monthlyUsage: Math.round(monthlyUsagePercent),
      minuteUsage: Math.round(minuteUsagePercent),
      isWarning,
      isCritical
    })

    // Update overall status
    if (isCritical) {
      analysis.monthlyStatus = 'critical'
      analysis.minuteStatus = 'critical'
    } else if (isWarning && analysis.monthlyStatus === 'normal') {
      analysis.monthlyStatus = 'warning'
      analysis.minuteStatus = 'warning'
    }
  }

  return analysis
}

// Helper function to calculate usage trends
async function calculateUsageTrends(userId: string, timeRanges: Record<string, Date>) {
  const now = new Date()
  
  // Previous periods for comparison
  const previousRanges = {
    previousMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    previousWeek: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  }

  const [currentMonthUsage, previousMonthUsage, currentWeekUsage, previousWeekUsage] = await Promise.all([
    prisma.usageStats.aggregate({
      where: {
        userId,
        date: { gte: timeRanges.thisMonth }
      },
      _sum: { requestCount: true, cost: true }
    }),
    
    prisma.usageStats.aggregate({
      where: {
        userId,
        date: { 
          gte: previousRanges.previousMonth,
          lt: timeRanges.thisMonth
        }
      },
      _sum: { requestCount: true, cost: true }
    }),

    prisma.usageStats.aggregate({
      where: {
        userId,
        date: { gte: timeRanges.thisWeek }
      },
      _sum: { requestCount: true, cost: true }
    }),

    prisma.usageStats.aggregate({
      where: {
        userId,
        date: { 
          gte: previousRanges.previousWeek,
          lt: timeRanges.thisWeek
        }
      },
      _sum: { requestCount: true, cost: true }
    })
  ])

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    monthly: {
      requestsTrend: calculateTrend(
        currentMonthUsage._sum.requestCount || 0,
        previousMonthUsage._sum.requestCount || 0
      ),
      costTrend: calculateTrend(
        currentMonthUsage._sum.cost || 0,
        previousMonthUsage._sum.cost || 0
      )
    },
    weekly: {
      requestsTrend: calculateTrend(
        currentWeekUsage._sum.requestCount || 0,
        previousWeekUsage._sum.requestCount || 0
      ),
      costTrend: calculateTrend(
        currentWeekUsage._sum.cost || 0,
        previousWeekUsage._sum.cost || 0
      )
    }
  }
}

// Helper function to generate usage alerts
function generateUsageAlerts(usageAnalysis: any, subscriptions: any[]) {
  const alerts = []
  const now = new Date()

  // Usage limit alerts
  for (const usage of usageAnalysis.utilizationPercentages) {
    if (usage.isCritical) {
      alerts.push({
        type: 'critical',
        title: 'Usage Limit Critical',
        message: `${usage.modelName} has reached ${usage.monthlyUsage}% of monthly limit`,
        action: 'Consider upgrading your plan or reducing usage'
      })
    } else if (usage.isWarning) {
      alerts.push({
        type: 'warning',
        title: 'Approaching Usage Limit',
        message: `${usage.modelName} has used ${usage.monthlyUsage}% of monthly limit`,
        action: 'Monitor usage carefully'
      })
    }
  }

  // Subscription expiry alerts
  for (const subscription of subscriptions) {
    const daysRemaining = Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining <= 1) {
      alerts.push({
        type: 'critical',
        title: 'Subscription Expiring Soon',
        message: `${subscription.model.name} subscription expires in ${daysRemaining} day(s)`,
        action: 'Renew subscription to maintain access'
      })
    } else if (daysRemaining <= 3) {
      alerts.push({
        type: 'warning',
        title: 'Subscription Expiring',
        message: `${subscription.model.name} subscription expires in ${daysRemaining} days`,
        action: 'Consider renewing soon'
      })
    }
  }

  return alerts
}

// Export with rate limiting (higher rate limit for dashboard)
export const GET = withRateLimit(rateLimiters.dashboard, getUsageSummaryHandler) 