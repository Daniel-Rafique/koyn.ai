import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'

// GET - Fetch creator's models with analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a creator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { creatorProfile: true }
    })

    if (!user || user.type !== 'CREATOR' || !user.creatorProfile) {
      return NextResponse.json(
        { error: 'Creator access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // all, draft, published, deprecated
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const whereClause: Record<string, unknown> = {
      creatorId: user.creatorProfile.id
    }

    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase()
    }

    // Fetch creator's models with detailed analytics
    const models = await prisma.model.findMany({
      where: whereClause,
      include: {
        pricing: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            unit: true
          }
        },
        subscriptions: {
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            createdAt: true
          }
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            subscriptions: true,
            reviews: true,
            discussions: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Calculate analytics for each model
    const modelsWithAnalytics = models.map(model => {
      const activeSubscriptions = model.subscriptions.filter(s => s.status === 'ACTIVE').length
      const monthlyRevenue = model.subscriptions
        .filter(s => s.status === 'ACTIVE')
        .reduce((sum, sub) => {
          const plan = model.pricing.find(p => p.id === (sub as any).planId)
          return sum + (plan?.price || 0)
        }, 0)

      const recentReviews = model.reviews.filter(
        r => r.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length

      return {
        id: model.id,
        name: model.name,
        slug: model.slug,
        description: model.description,
        category: model.category,
        status: model.status,
        featured: model.featured,
        rating: model.rating,
        reviewCount: model.reviewCount,
        downloadCount: model.downloadCount,
        apiCallCount: model.apiCallCount,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        pricing: model.pricing,
        analytics: {
          activeSubscriptions,
          totalSubscriptions: model._count.subscriptions,
          monthlyRevenue,
          recentReviews,
          totalReviews: model._count.reviews,
          totalDiscussions: model._count.discussions
        }
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.model.count({ where: whereClause })

    // Calculate summary statistics
    const summary = await prisma.model.groupBy({
      by: ['status'],
      where: { creatorId: user.creatorProfile.id },
      _count: {
        status: true
      },
      _sum: {
        downloadCount: true,
        apiCallCount: true
      },
      _avg: {
        rating: true
      }
    })

    const summaryStats = summary.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = {
        count: item._count.status,
        totalDownloads: item._sum.downloadCount || 0,
        totalApiCalls: item._sum.apiCallCount || 0,
        averageRating: item._avg.rating || 0
      }
      return acc
    }, {} as Record<string, {
      count: number
      totalDownloads: number
      totalApiCalls: number
      averageRating: number
    }>)

    // Calculate total revenue
    const totalRevenue = await prisma.subscription.aggregate({
      where: {
        model: {
          creatorId: user.creatorProfile.id
        },
        status: 'ACTIVE'
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        models: modelsWithAnalytics,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + models.length < totalCount
        },
        summary: {
          totalModels: totalCount,
          byStatus: summaryStats,
          activeSubscriptions: totalRevenue._count.id,
          creatorProfile: {
            id: user.creatorProfile.id,
            displayName: user.creatorProfile.displayName,
            verified: user.creatorProfile.verified,
            rating: user.creatorProfile.rating,
            totalEarnings: user.creatorProfile.totalEarnings,
            totalDownloads: user.creatorProfile.totalDownloads
          }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching creator models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator models' },
      { status: 500 }
    )
  }
}

// POST - Bulk operations on models
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a creator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { creatorProfile: true }
    })

    if (!user || user.type !== 'CREATOR' || !user.creatorProfile) {
      return NextResponse.json(
        { error: 'Creator access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, modelIds } = body

    if (!action || !Array.isArray(modelIds) || modelIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and modelIds array are required' },
        { status: 400 }
      )
    }

    // Verify all models belong to the creator
    const models = await prisma.model.findMany({
      where: {
        id: { in: modelIds },
        creatorId: user.creatorProfile.id
      }
    })

    if (models.length !== modelIds.length) {
      return NextResponse.json(
        { error: 'Some models not found or access denied' },
        { status: 403 }
      )
    }

    let result;
    switch (action) {
      case 'publish':
        result = await prisma.model.updateMany({
          where: {
            id: { in: modelIds },
            creatorId: user.creatorProfile.id
          },
          data: {
            status: 'PUBLISHED',
            updatedAt: new Date()
          }
        })
        break

      case 'unpublish':
        result = await prisma.model.updateMany({
          where: {
            id: { in: modelIds },
            creatorId: user.creatorProfile.id
          },
          data: {
            status: 'DRAFT',
            updatedAt: new Date()
          }
        })
        break

      case 'deprecate':
        // Check for active subscriptions
        const activeSubscriptions = await prisma.subscription.count({
          where: {
            modelId: { in: modelIds },
            status: 'ACTIVE'
          }
        })

        if (activeSubscriptions > 0) {
          return NextResponse.json(
            { error: 'Cannot deprecate models with active subscriptions' },
            { status: 400 }
          )
        }

        result = await prisma.model.updateMany({
          where: {
            id: { in: modelIds },
            creatorId: user.creatorProfile.id
          },
          data: {
            status: 'DEPRECATED',
            updatedAt: new Date()
          }
        })
        break

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        affectedModels: result.count,
        action
      },
      message: `Successfully ${action}ed ${result.count} model(s)`
    })

  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
} 