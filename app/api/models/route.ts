import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'popularity'
    const pricing = searchParams.get('pricing')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      status: 'PUBLISHED'
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { creator: { displayName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Apply category filter
    if (category && category !== 'all') {
      where.category = category
    }

    // Apply pricing filter
    if (pricing && pricing !== 'all') {
      if (pricing === 'free') {
        where.pricing = {
          some: {
            type: 'FREE',
            active: true
          }
        }
      } else if (pricing === 'paid') {
        where.pricing = {
          some: {
            type: 'PREMIUM',
            active: true
          }
        }
      } else if (pricing === 'freemium') {
        where.pricing = {
          some: {
            type: 'FREEMIUM',
            active: true
          }
        }
      }
    }

    // Build order by clause
    let orderBy: any = { downloadCount: 'desc' } // default popularity

    switch (sort) {
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'downloads':
        orderBy = { downloadCount: 'desc' }
        break
      case 'recent':
        orderBy = { createdAt: 'desc' }
        break
      case 'price-low':
        // This is complex with Prisma, we'll handle it in post-processing
        orderBy = { downloadCount: 'desc' }
        break
      case 'price-high':
        // This is complex with Prisma, we'll handle it in post-processing
        orderBy = { downloadCount: 'desc' }
        break
      default:
        orderBy = { downloadCount: 'desc' }
    }

    // Fetch models and total count
    const [models, total] = await Promise.all([
      prisma.model.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              verified: true
            }
          },
          pricing: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              unit: true,
              active: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.model.count({ where })
    ])

    // Post-process for price sorting if needed
    if (sort === 'price-low' || sort === 'price-high') {
      models.sort((a, b) => {
        const aPrice = Math.min(...a.pricing.map(p => p.price))
        const bPrice = Math.min(...b.pricing.map(p => p.price))
        return sort === 'price-low' ? aPrice - bPrice : bPrice - aPrice
      })
    }

    // Transform the data to match the frontend interface
    const transformedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      slug: model.slug,
      description: model.description,
      category: model.category,
      architecture: model.architecture,
      tags: model.tags,
      creator: {
        id: model.creator.id,
        displayName: model.creator.displayName,
        verified: model.creator.verified
      },
      pricing: model.pricing,
      rating: model.rating,
      reviewCount: model.reviewCount,
      downloadCount: model.downloadCount,
      featured: model.featured,
      license: model.license,
      createdAt: model.createdAt.toISOString()
    }))

    return NextResponse.json({
      models: transformedModels,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
} 