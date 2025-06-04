import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { validateRequest, modelSchemas, sanitizers, securityValidation } from '@/lib/validation'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Fetch models with search and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const license = searchParams.get('license') 
    const featured = searchParams.get('featured')
    const creatorId = searchParams.get('creatorId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: 'PUBLISHED' // Only show published models
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    if (category) whereClause.category = category
    if (license) whereClause.license = license
    if (featured === 'true') whereClause.featured = true
    if (creatorId) whereClause.creatorId = creatorId

    // Fetch models with creator info
    const models = await prisma.model.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            verified: true,
            rating: true
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
            features: true
          }
        },
        _count: {
          select: {
            reviews: true,
            subscriptions: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.model.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      data: {
        models,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + models.length < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

// POST - Create new model (Creator only)
async function createModelHandler(request: NextRequest) {
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
    
    // Validate request data
    const validation = validateRequest(modelSchemas.create)(body)
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

    const { 
      name, 
      description, 
      longDescription,
      category,
      subcategory,
      architecture,
      tasks,
      modelSize,
      contextLength,
      inputModalities,
      outputModalities,
      license,
      version,
      tags,
      apiEndpoint,
      externalId,
      externalSource,
      pricing
    } = validation.data

    // Security checks
    if (securityValidation.hasSQLInjection(name) || securityValidation.hasXSS(name)) {
      return NextResponse.json(
        { error: 'Invalid input detected in name' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedName = sanitizers.html(name)
    const sanitizedDescription = sanitizers.html(description)
    const sanitizedLongDescription = longDescription ? sanitizers.html(longDescription) : null

    // Generate unique slug
    const baseSlug = sanitizedName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    let slug = baseSlug
    let counter = 1
    while (await prisma.model.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create model
    const model = await prisma.model.create({
      data: {
        name: sanitizedName,
        slug,
        description: sanitizedDescription,
        longDescription: sanitizedLongDescription,
        creatorId: user.creatorProfile.id,
        category,
        subcategory,
        architecture,
        tasks,
        modelSize,
        contextLength,
        inputModalities,
        outputModalities,
        license,
        version: version || '1.0.0',
        tags,
        apiEndpoint,
        externalId,
        externalSource,
        status: 'DRAFT', // Start as draft
        featured: false,
        rating: 0,
        reviewCount: 0,
        downloadCount: 0,
        apiCallCount: 0
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            verified: true
          }
        }
      }
    })

    // Create pricing plans if provided
    if (pricing && pricing.length > 0) {
      const pricingPlans = await Promise.all(
        pricing.map((plan) => 
          prisma.pricingPlan.create({
            data: {
              modelId: model.id,
              name: plan.name,
              type: plan.type,
              price: plan.price,
              unit: plan.unit,
              requestsPerMonth: plan.requestsPerMonth,
              requestsPerMinute: plan.requestsPerMinute,
              maxBatchSize: plan.maxBatchSize,
              features: plan.features,
              supportLevel: plan.supportLevel || 'STANDARD',
              active: true
            }
          })
        )
      )

      return NextResponse.json({
        success: true,
        data: { 
          model: { ...model, pricing: pricingPlans }
        },
        message: 'Model created successfully'
      }, { status: 201 })
    }

    return NextResponse.json({
      success: true,
      data: { model },
      message: 'Model created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating model:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A model with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
}

// Export with rate limiting
export const POST = withRateLimit(rateLimiters.general, createModelHandler) 