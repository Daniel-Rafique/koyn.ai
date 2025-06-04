import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Advanced search with autocomplete and suggestions
async function searchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const type = searchParams.get('type') || 'all' // 'models', 'creators', 'tags', 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeCount = searchParams.get('includeCount') === 'true'

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          models: [],
          creators: [],
          tags: [],
          suggestions: []
        }
      })
    }

    const searchTerm = query.toLowerCase().trim()
    const results: any = {}

    // Search models
    if (type === 'all' || type === 'models') {
      const models = await prisma.model.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } },
            { tasks: { hasSome: [searchTerm] } },
            { architecture: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          tags: true,
          rating: true,
          downloadCount: true,
          featured: true,
          creator: {
            select: {
              displayName: true,
              verified: true
            }
          }
        },
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { downloadCount: 'desc' },
          { rating: 'desc' }
        ]
      })

      results.models = models.map(model => ({
        ...model,
        type: 'model',
        match: getMatchRelevance(searchTerm, model.name, model.description, model.tags)
      }))
    }

    // Search creators
    if (type === 'all' || type === 'creators') {
      const creators = await prisma.creatorProfile.findMany({
        where: {
          OR: [
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { bio: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          displayName: true,
          bio: true,
          verified: true,
          rating: true,
          totalEarnings: true,
          user: {
            select: {
              avatar: true
            }
          },
          _count: {
            select: {
              models: true
            }
          }
        },
        take: limit,
        orderBy: [
          { verified: 'desc' },
          { rating: 'desc' },
          { totalEarnings: 'desc' }
        ]
      })

      results.creators = creators.map(creator => ({
        ...creator,
        type: 'creator',
        match: getMatchRelevance(searchTerm, creator.displayName, creator.bio || '', [])
      }))
    }

    // Search and suggest tags
    if (type === 'all' || type === 'tags') {
      const tagResults = await prisma.$queryRaw<Array<{ tag: string; count: number }>>`
        SELECT unnest(tags) as tag, COUNT(*) as count
        FROM "Model" 
        WHERE status = 'PUBLISHED' 
        AND unnest(tags) ILIKE ${`%${searchTerm}%`}
        GROUP BY tag 
        ORDER BY count DESC, tag ASC
        LIMIT ${limit}
      `

      results.tags = tagResults.map(({ tag, count }) => ({
        tag,
        count: Number(count),
        type: 'tag',
        match: getTextSimilarity(searchTerm, tag)
      }))
    }

    // Generate search suggestions based on popular terms
    const suggestions: string[] = []
    
    if (type === 'all') {
      // Get popular model names for suggestions
      const popularModels = await prisma.model.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } }
          ]
        },
        select: { name: true, downloadCount: true, tags: true },
        orderBy: { downloadCount: 'desc' },
        take: 5
      })

      // Extract suggestions from model names and tags
      popularModels.forEach(model => {
        const nameWords = model.name.toLowerCase().split(' ')
        const relevantWords = nameWords.filter(word => 
          word.includes(searchTerm) && word.length > 2
        )
        relevantWords.forEach(word => {
          if (!suggestions.includes(word)) {
            suggestions.push(word)
          }
        })

        // Add relevant tags
        model.tags.forEach(tag => {
          if (tag.toLowerCase().includes(searchTerm) && !suggestions.includes(tag)) {
            suggestions.push(tag)
          }
        })
      })
    }

    // Sort all results by relevance
    Object.keys(results).forEach(key => {
      if (Array.isArray(results[key])) {
        results[key].sort((a: any, b: any) => b.match - a.match)
      }
    })

    const responseData: any = {
      ...results,
      suggestions: suggestions.slice(0, 5),
      query: searchTerm
    }

    // Add counts if requested
    if (includeCount) {
      responseData.counts = {
        models: results.models?.length || 0,
        creators: results.creators?.length || 0,
        tags: results.tags?.length || 0,
        total: (results.models?.length || 0) + (results.creators?.length || 0) + (results.tags?.length || 0)
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

// Helper function to calculate match relevance
function getMatchRelevance(searchTerm: string, name: string, description: string, tags: string[]): number {
  let score = 0
  const search = searchTerm.toLowerCase()
  const nameL = name.toLowerCase()
  const descL = description.toLowerCase()

  // Exact name match gets highest score
  if (nameL === search) score += 100
  // Name starts with search term
  else if (nameL.startsWith(search)) score += 80
  // Name contains search term
  else if (nameL.includes(search)) score += 60

  // Description matches
  if (descL.includes(search)) score += 20

  // Tag matches
  tags.forEach(tag => {
    const tagL = tag.toLowerCase()
    if (tagL === search) score += 40
    else if (tagL.includes(search)) score += 20
  })

  return score
}

// Helper function for text similarity (simple Levenshtein-like)
function getTextSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

export const GET = withRateLimit(rateLimiters.general, searchHandler) 