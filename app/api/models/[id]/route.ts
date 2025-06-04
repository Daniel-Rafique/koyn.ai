import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { validateRequest, modelSchemas, sanitizers, securityValidation } from '@/lib/validation'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

interface RouteParams {
  params: { id: string }
}

// GET - Fetch individual model details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const model = await prisma.model.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            verified: true,
            rating: true,
            totalDownloads: true
          }
        },
        pricing: {
          where: { active: true },
          orderBy: { price: 'asc' }
        },
        benchmarks: true,
        versions: {
          orderBy: { releaseDate: 'desc' },
          take: 5
        },
        files: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
            subscriptions: true,
            discussions: true
          }
        }
      }
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Check if model is accessible (published or owned by user)
    const session = await getServerSession()
    const isOwner = session?.user?.id && model.creator.id === session.user.id
    
    if (model.status !== 'PUBLISHED' && !isOwner) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { model }
    })

  } catch (error) {
    console.error('Error fetching model:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    )
  }
}

// PUT - Update model (Creator only)
async function updateModelHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check model ownership
    const existingModel = await prisma.model.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    if (existingModel.creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only modify your own models.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validation = validateRequest(modelSchemas.update)(body)
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
      status
    } = validation.data

    // Security checks
    if (name && (securityValidation.hasSQLInjection(name) || securityValidation.hasXSS(name))) {
      return NextResponse.json(
        { error: 'Invalid input detected in name' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (name) {
      updateData.name = sanitizers.html(name)
      
      // Update slug if name changed
      if (name !== existingModel.name) {
        const baseSlug = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

        let slug = baseSlug
        let counter = 1
        while (await prisma.model.findFirst({ 
          where: { 
            slug,
            NOT: { id }
          } 
        })) {
          slug = `${baseSlug}-${counter}`
          counter++
        }
        updateData.slug = slug
      }
    }

    if (description) updateData.description = sanitizers.html(description)
    if (longDescription) updateData.longDescription = sanitizers.html(longDescription)
    if (category) updateData.category = category
    if (subcategory) updateData.subcategory = subcategory
    if (architecture) updateData.architecture = architecture
    if (tasks) updateData.tasks = tasks
    if (modelSize) updateData.modelSize = modelSize
    if (contextLength) updateData.contextLength = contextLength
    if (inputModalities) updateData.inputModalities = inputModalities
    if (outputModalities) updateData.outputModalities = outputModalities
    if (license) updateData.license = license
    if (version) updateData.version = version
    if (tags) updateData.tags = tags
    if (apiEndpoint) updateData.apiEndpoint = apiEndpoint
    if (status) updateData.status = status

    // Update model
    const updatedModel = await prisma.model.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            verified: true
          }
        },
        pricing: {
          where: { active: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { model: updatedModel },
      message: 'Model updated successfully'
    })

  } catch (error) {
    console.error('Error updating model:', error)
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    )
  }
}

// DELETE - Delete model (Creator only)
async function deleteModelHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check model ownership
    const existingModel = await prisma.model.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            userId: true
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    if (existingModel.creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only delete your own models.' },
        { status: 403 }
      )
    }

    // Check if model has active subscriptions
    if (existingModel.subscriptions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete model with active subscriptions. Please wait for subscriptions to expire or contact support.' },
        { status: 400 }
      )
    }

    // Soft delete - set status to DEPRECATED instead of hard delete
    await prisma.model.update({
      where: { id },
      data: {
        status: 'DEPRECATED',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Model deprecated successfully. It will no longer be visible to users.'
    })

  } catch (error) {
    console.error('Error deleting model:', error)
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    )
  }
}

// Create wrapper functions for rate limiting
const rateLimitedUpdateHandler = (request: NextRequest) => {
  // Extract params from the request URL
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const id = pathSegments[pathSegments.length - 1]
  
  return updateModelHandler(request, { params: { id } })
}

const rateLimitedDeleteHandler = (request: NextRequest) => {
  // Extract params from the request URL
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const id = pathSegments[pathSegments.length - 1]
  
  return deleteModelHandler(request, { params: { id } })
}

// Export with rate limiting
export const PUT = withRateLimit(rateLimiters.general, rateLimitedUpdateHandler)
export const DELETE = withRateLimit(rateLimiters.general, rateLimitedDeleteHandler) 