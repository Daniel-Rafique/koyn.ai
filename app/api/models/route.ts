import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { validateRequest, modelSchemas, sanitizers, securityValidation } from '@/lib/validation'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Fetch models with enhanced search and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Basic parameters
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const license = searchParams.get('license') 
    const featured = searchParams.get('featured')
    const creatorId = searchParams.get('creatorId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || searchParams.get('sortBy') || 'popularity'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Advanced filtering parameters
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null
    const maxRating = searchParams.get('maxRating') ? parseFloat(searchParams.get('maxRating')!) : null
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const architecture = searchParams.get('architecture')
    const tasks = searchParams.get('tasks')?.split(',').filter(Boolean) || []
    const inputModalities = searchParams.get('inputModalities')?.split(',').filter(Boolean) || []
    const outputModalities = searchParams.get('outputModalities')?.split(',').filter(Boolean) || []
    const verified = searchParams.get('verified')
    const hasFreeTier = searchParams.get('hasFreeTier')
    const modelSize = searchParams.get('modelSize') // e.g., "small", "medium", "large"
    const maxLatency = searchParams.get('maxLatency') ? parseInt(searchParams.get('maxLatency')!) : null
    const pricing = searchParams.get('pricing') // "free", "paid", "freemium"

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: 'PUBLISHED' // Only show published models
    }

    // Enhanced search logic with fuzzy matching
    if (search) {
      const searchTerm = search.toLowerCase().trim()
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { longDescription: { contains: searchTerm, mode: 'insensitive' } },
        { architecture: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm] } },
        { tasks: { hasSome: [searchTerm] } },
        { 
          creator: { 
            displayName: { contains: searchTerm, mode: 'insensitive' } 
          } 
        }
      ]
    }

    // Category and license filters
    if (category) whereClause.category = category
    if (license) whereClause.license = license
    if (featured === 'true') whereClause.featured = true
    if (creatorId) whereClause.creatorId = creatorId
    
    // Architecture and technical filters
    if (architecture) whereClause.architecture = { contains: architecture, mode: 'insensitive' }
    if (tasks.length > 0) whereClause.tasks = { hasSome: tasks }
    if (inputModalities.length > 0) whereClause.inputModalities = { hasSome: inputModalities }
    if (outputModalities.length > 0) whereClause.outputModalities = { hasSome: outputModalities }
    
    // Tags filter
    if (tags.length > 0) whereClause.tags = { hasSome: tags }
    
    // Rating filter
    if (minRating !== null) {
      whereClause.rating = { ...(whereClause.rating as object || {}), gte: minRating }
    }
    if (maxRating !== null) {
      whereClause.rating = { ...(whereClause.rating as object || {}), lte: maxRating }
    }
    
    // Performance filter
    if (maxLatency !== null) {
      whereClause.averageLatency = { lte: maxLatency }
    }
    
    // Model size filter (approximate matching)
    if (modelSize) {
      const sizePatterns = {
        'small': ['<1B', '1B', '2B', '3B', '7B'],
        'medium': ['7B', '13B', '30B', '34B'],
        'large': ['70B', '175B', '340B', '1.7B', '3.3B', '3.5B']
      }
      
      const patterns = sizePatterns[modelSize as keyof typeof sizePatterns]
      if (patterns) {
        whereClause.OR = patterns.map(pattern => ({
          modelSize: { contains: pattern, mode: 'insensitive' }
        }))
      }
    }
    
    // Creator verification filter
    if (verified === 'true') {
      whereClause.creator = { verified: true }
    }

    // Build the orderBy clause for different sort options
    let orderBy: any = { createdAt: 'desc' } // default
    
    switch (sortBy) {
      case 'popularity':
        orderBy = [
          { featured: 'desc' },
          { downloadCount: 'desc' },
          { apiCallCount: 'desc' }
        ]
        break
      case 'rating':
        orderBy = [
          { rating: 'desc' },
          { reviewCount: 'desc' }
        ]
        break
      case 'downloads':
        orderBy = { downloadCount: 'desc' }
        break
      case 'recent':
        orderBy = { createdAt: 'desc' }
        break
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'price-low':
        // This requires a more complex query with pricing join
        orderBy = { createdAt: 'desc' } // fallback for now
        break
      case 'price-high':
        // This requires a more complex query with pricing join
        orderBy = { createdAt: 'desc' } // fallback for now
        break
      default:
        orderBy = { [sortBy]: sortOrder }
    }

    // Fetch models with enhanced includes
    const models = await prisma.model.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            verified: true,
            rating: true,
            avatar: true
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
            features: true,
            supportLevel: true,
            requestsPerMonth: true,
            requestsPerMinute: true
          },
          orderBy: { price: 'asc' }
        },
        _count: {
          select: {
            reviews: true,
            subscriptions: true,
            usageRecords: true
          }
        }
      },
      orderBy,
      take: limit,
      skip: offset
    })

    // Apply pricing filters after fetching (since it requires joining)
    let filteredModels = models
    
    if (minPrice !== null || maxPrice !== null || hasFreeTier || pricing) {
      filteredModels = models.filter(model => {
        const prices = model.pricing.map(p => p.price)
        const hasFreePlan = model.pricing.some(p => p.type === 'FREE' || p.price === 0)
        const minModelPrice = Math.min(...prices.filter(p => p > 0))
        const maxModelPrice = Math.max(...prices)
        
        // Free tier filter
        if (hasFreeTier === 'true' && !hasFreePlan) return false
        
        // Pricing type filter
        if (pricing === 'free' && !hasFreePlan) return false
        if (pricing === 'paid' && hasFreePlan && prices.every(p => p === 0)) return false
        if (pricing === 'freemium' && !hasFreePlan) return false
        
        // Price range filter
        if (minPrice !== null && minModelPrice < minPrice) return false
        if (maxPrice !== null && maxModelPrice > maxPrice) return false
        
        return true
      })
    }

    // Get total count for pagination (approximate for complex filters)
    const totalCount = await prisma.model.count({ where: whereClause })

    // Calculate facets/aggregations for frontend filters
    const facets = await Promise.all([
      // Category counts
      prisma.model.groupBy({
        by: ['category'],
        where: { status: 'PUBLISHED' },
        _count: { category: true }
      }),
      // License counts  
      prisma.model.groupBy({
        by: ['license'],
        where: { status: 'PUBLISHED' },
        _count: { license: true }
      }),
      // Architecture counts
      prisma.model.groupBy({
        by: ['architecture'],
        where: { status: 'PUBLISHED' },
        _count: { architecture: true }
      })
    ])

    const [categoryFacets, licenseFacets, architectureFacets] = facets

    return NextResponse.json({
      success: true,
      data: {
        models: filteredModels,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + filteredModels.length < totalCount
        },
        facets: {
          categories: categoryFacets.map(f => ({ 
            value: f.category, 
            count: f._count.category 
          })),
          licenses: licenseFacets.map(f => ({ 
            value: f.license, 
            count: f._count.license 
          })),
          architectures: architectureFacets.map(f => ({ 
            value: f.architecture, 
            count: f._count.architecture 
          }))
        },
        appliedFilters: {
          search,
          category,
          license,
          featured: featured === 'true',
          minPrice,
          maxPrice,
          minRating,
          maxRating,
          tags,
          architecture,
          tasks,
          verified: verified === 'true',
          hasFreeTier: hasFreeTier === 'true',
          pricing
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