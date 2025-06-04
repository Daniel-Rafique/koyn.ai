import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Get all available filter options for models
async function getFiltersHandler(request: NextRequest) {
  try {
    // Run all aggregation queries in parallel
    const [
      categoryStats,
      licenseStats, 
      architectureStats,
      priceStats,
      taskStats,
      modalityStats,
      verifiedCreatorCount,
      totalModels
    ] = await Promise.all([
      // Category distribution
      prisma.model.groupBy({
        by: ['category'],
        where: { status: 'PUBLISHED' },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } }
      }),

      // License distribution
      prisma.model.groupBy({
        by: ['license'],
        where: { status: 'PUBLISHED' },
        _count: { license: true },
        orderBy: { _count: { license: 'desc' } }
      }),

      // Architecture distribution
      prisma.model.groupBy({
        by: ['architecture'],
        where: { status: 'PUBLISHED' },
        _count: { architecture: true },
        orderBy: { _count: { architecture: 'desc' } }
      }),

      // Price statistics
      prisma.pricingPlan.aggregate({
        where: { 
          active: true,
          model: { status: 'PUBLISHED' }
        },
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true }
      }),

      // Task distribution (flatten array fields)
      prisma.$queryRaw<Array<{ task: string; count: number }>>`
        SELECT unnest(tasks) as task, COUNT(*) as count
        FROM "models" 
        WHERE status = 'PUBLISHED' 
        GROUP BY task 
        ORDER BY count DESC
        LIMIT 20
      `,

      // Input/Output modality distribution
      prisma.$queryRaw<Array<{ modality: string; type: string; count: number }>>`
        SELECT unnest("inputModalities") as modality, 'input' as type, COUNT(*) as count
        FROM "models" 
        WHERE status = 'PUBLISHED' 
        GROUP BY modality
        UNION
        SELECT unnest("outputModalities") as modality, 'output' as type, COUNT(*) as count
        FROM "models" 
        WHERE status = 'PUBLISHED' 
        GROUP BY modality
        ORDER BY count DESC
      `,

      // Verified creator count
      prisma.model.count({
        where: { 
          status: 'PUBLISHED',
          creator: { verified: true }
        }
      }),

      // Total published models
      prisma.model.count({
        where: { status: 'PUBLISHED' }
      })
    ])

    // Get popular tags
    const popularTags = await prisma.$queryRaw<Array<{ tag: string; count: number }>>`
      SELECT unnest(tags) as tag, COUNT(*) as count
      FROM "models" 
      WHERE status = 'PUBLISHED' 
      GROUP BY tag 
      ORDER BY count DESC, tag ASC
      LIMIT 50
    `

    // Get rating distribution
    const ratingStats = await prisma.model.aggregate({
      where: { status: 'PUBLISHED' },
      _min: { rating: true },
      _max: { rating: true },
      _avg: { rating: true }
    })

    // Get model size categories
    const modelSizeStats = await prisma.$queryRaw<Array<{ size_category: string; count: number }>>`
      SELECT 
        CASE 
          WHEN "modelSize" ILIKE '%<1B%' OR "modelSize" ILIKE '%1B%' OR "modelSize" ILIKE '%2B%' OR "modelSize" ILIKE '%3B%' OR "modelSize" ILIKE '%7B%' THEN 'small'
          WHEN "modelSize" ILIKE '%13B%' OR "modelSize" ILIKE '%30B%' OR "modelSize" ILIKE '%34B%' THEN 'medium'
          WHEN "modelSize" ILIKE '%70B%' OR "modelSize" ILIKE '%175B%' OR "modelSize" ILIKE '%340B%' OR "modelSize" ILIKE '%1.7B%' OR "modelSize" ILIKE '%3.3B%' OR "modelSize" ILIKE '%3.5B%' THEN 'large'
          ELSE 'unknown'
        END as size_category,
        COUNT(*) as count
      FROM "models" 
      WHERE status = 'PUBLISHED'
      GROUP BY size_category
      ORDER BY count DESC
    `

    // Calculate pricing type distribution
    const pricingTypeStats = await prisma.$queryRaw<Array<{ pricing_type: string; count: number }>>`
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM "pricing_plans" p 
            WHERE p."modelId" = m.id 
            AND p.active = true 
            AND (p.type = 'FREE' OR p.price = 0)
          ) AND EXISTS (
            SELECT 1 FROM "pricing_plans" p 
            WHERE p."modelId" = m.id 
            AND p.active = true 
            AND p.type = 'PREMIUM' 
            AND p.price > 0
          ) THEN 'freemium'
          WHEN EXISTS (
            SELECT 1 FROM "pricing_plans" p 
            WHERE p."modelId" = m.id 
            AND p.active = true 
            AND (p.type = 'FREE' OR p.price = 0)
          ) THEN 'free'
          ELSE 'paid'
        END as pricing_type,
        COUNT(*) as count
      FROM "models" m
      WHERE m.status = 'PUBLISHED'
      GROUP BY pricing_type
      ORDER BY count DESC
    `

    // Organize modalities by type
    const inputModalities = modalityStats
      .filter(m => m.type === 'input')
      .map(m => ({ modality: m.modality, count: Number(m.count) }))
      .sort((a, b) => b.count - a.count)

    const outputModalities = modalityStats
      .filter(m => m.type === 'output')
      .map(m => ({ modality: m.modality, count: Number(m.count) }))
      .sort((a, b) => b.count - a.count)

    const response = {
      success: true,
      data: {
        // Basic counts
        totalModels,
        verifiedCreatorModels: verifiedCreatorCount,
        
        // Category filters
        categories: categoryStats.map(stat => ({
          value: stat.category,
          label: stat.category.replace('_', ' '),
          count: stat._count.category
        })),

        // License filters
        licenses: licenseStats.map(stat => ({
          value: stat.license,
          label: stat.license.replace('_', ' '),
          count: stat._count.license
        })),

        // Architecture filters
        architectures: architectureStats.map(stat => ({
          value: stat.architecture,
          label: stat.architecture,
          count: stat._count.architecture
        })),

        // Popular tags
        tags: popularTags.map(tag => ({
          value: tag.tag,
          label: tag.tag,
          count: Number(tag.count)
        })),

        // Task filters
        tasks: taskStats.map(task => ({
          value: task.task,
          label: task.task.replace('-', ' '),
          count: Number(task.count)
        })),

        // Modality filters
        inputModalities,
        outputModalities,

        // Price ranges
        priceRanges: {
          min: priceStats._min.price || 0,
          max: priceStats._max.price || 100,
          average: priceStats._avg.price || 0,
          suggested: [
            { label: 'Free', min: 0, max: 0 },
            { label: 'Under $0.10', min: 0, max: 0.1 },
            { label: '$0.10 - $1.00', min: 0.1, max: 1.0 },
            { label: '$1.00 - $10.00', min: 1.0, max: 10.0 },
            { label: 'Over $10.00', min: 10.0, max: null }
          ]
        },

        // Rating ranges
        ratingRanges: {
          min: ratingStats._min.rating || 0,
          max: ratingStats._max.rating || 5,
          average: ratingStats._avg.rating || 0,
          suggested: [
            { label: '4+ Stars', min: 4.0, max: 5.0 },
            { label: '3+ Stars', min: 3.0, max: 5.0 },
            { label: '2+ Stars', min: 2.0, max: 5.0 },
            { label: 'Any Rating', min: 0, max: 5.0 }
          ]
        },

        // Model size categories
        modelSizes: modelSizeStats.map(size => ({
          value: size.size_category,
          label: size.size_category.charAt(0).toUpperCase() + size.size_category.slice(1),
          count: Number(size.count)
        })),

        // Pricing type distribution
        pricingTypes: pricingTypeStats.map(pricing => ({
          value: pricing.pricing_type,
          label: pricing.pricing_type.charAt(0).toUpperCase() + pricing.pricing_type.slice(1),
          count: Number(pricing.count)
        })),

        // Sort options
        sortOptions: [
          { value: 'popularity', label: 'Most Popular' },
          { value: 'recent', label: 'Recently Added' },
          { value: 'rating', label: 'Highest Rated' },
          { value: 'downloads', label: 'Most Downloaded' },
          { value: 'price-low', label: 'Price: Low to High' },
          { value: 'price-high', label: 'Price: High to Low' },
          { value: 'name', label: 'Name A-Z' }
        ]
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(rateLimiters.general, getFiltersHandler) 