import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { validateRequest, securityValidation } from '@/lib/validation'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

// Inference request schema
const inferenceSchema = z.object({
  inputs: z.union([
    z.string(),
    z.record(z.any()),
    z.array(z.any())
  ]).describe('Model inputs - can be text, objects, or arrays'),
  parameters: z.record(z.any()).optional().describe('Model-specific parameters'),
  options: z.object({
    stream: z.boolean().optional().default(false),
    maxTokens: z.number().int().min(1).max(4096).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    seed: z.number().int().optional()
  }).optional().default({})
})

// POST - Run model inference
async function runInferenceHandler(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()
  let tokensUsed = 0
  let success = false
  let session: any = null // Declare session at function level
  
  try {
    session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: modelId } = params
    const body = await request.json()
    
    // Validate request data
    const validation = validateRequest(inferenceSchema)(body)
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

    const { inputs, parameters, options } = validation.data

    // Security checks
    if (securityValidation.hasSQLInjection(JSON.stringify(inputs))) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }

    // Get model details and verify access
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: {
        id: true,
        name: true,
        status: true,
        externalId: true,
        externalSource: true,
        apiEndpoint: true,
        category: true,
        inputModalities: true,
        outputModalities: true,
        creator: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    })

    if (!model || model.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Model not found or not available' },
        { status: 404 }
      )
    }

    // Check subscription access and rate limits
    const accessResult = await checkUserAccess(session.user.id, modelId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { 
          error: 'Access denied - active subscription required',
          requiresSubscription: true,
          purchaseUrl: `/api/models/${modelId}/purchase`
        },
        { status: 403 }
      )
    }

    // Check rate limits based on subscription
    const rateLimitResult = await checkRateLimits(session.user.id, modelId)
    if (rateLimitResult.limitExceeded) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          limits: rateLimitResult.limits,
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        }
      )
    }

    // Estimate input tokens for cost calculation
    const inputTokens = estimateTokenCount(inputs)
    
    // Route to appropriate AI provider
    let inferenceResult
    
    try {
      if (model.externalSource === 'REPLICATE') {
        inferenceResult = await runReplicateModel(model.externalId!, inputs, { ...parameters, ...options })
      } else if (model.externalSource === 'HUGGINGFACE') {
        inferenceResult = await runHuggingFaceModel(model.externalId!, inputs, { ...parameters, ...options })
      } else {
        // Fallback to mock response for testing
        inferenceResult = await generateMockResponse(model, inputs, parameters)
      }

      success = true
      tokensUsed = inputTokens + estimateTokenCount(inferenceResult.output)

    } catch (providerError: any) {
      console.error('AI Provider error:', providerError)
      
      // Track failed usage
      await trackUsage(session.user.id, modelId, {
        tokensUsed: inputTokens,
        responseTime: Date.now() - startTime,
        success: false,
        errorType: 'provider_error',
        operation: 'inference'
      })

      return NextResponse.json(
        { 
          error: 'Model inference failed',
          details: providerError.message || 'Unknown provider error',
          modelId,
          provider: model.externalSource
        },
        { status: 502 }
      )
    }

    // Track successful usage
    await trackUsage(session.user.id, modelId, {
      tokensUsed,
      responseTime: Date.now() - startTime,
      success: true,
      operation: 'inference'
    })

    // Update model statistics
    await prisma.model.update({
      where: { id: modelId },
      data: {
        apiCallCount: { increment: 1 }
      }
    })

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        output: inferenceResult.output,
        model: {
          id: model.id,
          name: model.name,
          creator: model.creator.displayName
        },
        usage: {
          tokensUsed,
          responseTime: Date.now() - startTime,
          cost: calculateInferenceCost(tokensUsed, Date.now() - startTime)
        },
        metadata: {
          requestId: generateRequestId(),
          timestamp: new Date().toISOString(),
          provider: model.externalSource
        }
      }
    })

  } catch (error) {
    console.error('Inference error:', error)
    
    // Track failed usage if we have the required info
    if (session?.user?.id && params.id) {
      await trackUsage(session.user.id, params.id, {
        tokensUsed,
        responseTime: Date.now() - startTime,
        success: false,
        errorType: 'internal_error',
        operation: 'inference'
      }).catch(trackError => {
        console.error('Failed to track usage:', trackError)
      })
    }

    return NextResponse.json(
      { error: 'Internal server error during inference' },
      { status: 500 }
    )
  }
}

// GET - Check model inference availability and status
async function getInferenceStatusHandler(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: modelId } = params

    // Get model info
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: {
        id: true,
        name: true,
        status: true,
        category: true,
        externalSource: true,
        inputModalities: true,
        outputModalities: true,
        description: true,
        creator: {
          select: {
            displayName: true,
            verified: true
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

    // Check user access
    const accessResult = await checkUserAccess(session.user.id, modelId)
    const rateLimitResult = await checkRateLimits(session.user.id, modelId)

    return NextResponse.json({
      success: true,
      data: {
        model: {
          id: model.id,
          name: model.name,
          description: model.description,
          category: model.category,
          status: model.status,
          provider: model.externalSource,
          inputModalities: model.inputModalities,
          outputModalities: model.outputModalities,
          creator: model.creator
        },
        access: {
          hasAccess: accessResult.hasAccess,
          subscription: accessResult.subscription,
          requiresSubscription: !accessResult.hasAccess
        },
        limits: rateLimitResult.limits,
        endpoints: {
          inference: `/api/models/${modelId}/inference`,
          purchase: `/api/models/${modelId}/purchase`,
          usage: `/api/usage/stats?modelId=${modelId}`
        }
      }
    })

  } catch (error) {
    console.error('Error checking inference status:', error)
    return NextResponse.json(
      { error: 'Failed to check model status' },
      { status: 500 }
    )
  }
}

// Helper function to check user access
async function checkUserAccess(userId: string, modelId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      modelId,
      status: 'ACTIVE',
      currentPeriodEnd: {
        gt: new Date()
      }
    },
    include: {
      plan: {
        select: {
          name: true,
          requestsPerMonth: true,
          requestsPerMinute: true
        }
      }
    }
  })

  return {
    hasAccess: !!subscription,
    subscription: subscription ? {
      id: subscription.id,
      planName: subscription.plan.name,
      expiresAt: subscription.currentPeriodEnd,
      limits: {
        monthlyRequests: subscription.plan.requestsPerMonth,
        minuteRequests: subscription.plan.requestsPerMinute
      }
    } : null
  }
}

// Helper function to check rate limits
async function checkRateLimits(userId: string, modelId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfMinute = new Date(now.getTime() - 60000)

  const [monthlyUsage, minuteUsage, subscription] = await Promise.all([
    prisma.usageStats.aggregate({
      where: {
        userId,
        modelId,
        date: { gte: startOfMonth }
      },
      _sum: { requestCount: true }
    }),
    
    prisma.usageStats.aggregate({
      where: {
        userId,
        modelId,
        date: { gte: startOfMinute }
      },
      _sum: { requestCount: true }
    }),

    prisma.subscription.findFirst({
      where: {
        userId,
        modelId,
        status: 'ACTIVE',
        currentPeriodEnd: { gt: now }
      },
      include: {
        plan: {
          select: {
            requestsPerMonth: true,
            requestsPerMinute: true
          }
        }
      }
    })
  ])

  const currentMonthlyRequests = monthlyUsage._sum.requestCount || 0
  const currentMinuteRequests = minuteUsage._sum.requestCount || 0

  const limits = subscription?.plan ? {
    monthlyLimit: subscription.plan.requestsPerMonth || 1000,
    minuteLimit: subscription.plan.requestsPerMinute || 10,
    monthlyUsed: currentMonthlyRequests,
    minuteUsed: currentMinuteRequests
  } : {
    monthlyLimit: 0,
    minuteLimit: 0,
    monthlyUsed: 0,
    minuteUsed: 0
  }

  const monthlyLimitExceeded = currentMonthlyRequests >= limits.monthlyLimit
  const minuteLimitExceeded = currentMinuteRequests >= limits.minuteLimit

  return {
    limitExceeded: monthlyLimitExceeded || minuteLimitExceeded,
    limits,
    retryAfter: minuteLimitExceeded ? 60 : 3600 // 1 minute or 1 hour
  }
}

// Helper function to track usage (integrates with our usage tracking system)
async function trackUsage(userId: string, modelId: string, options: {
  tokensUsed: number
  responseTime: number
  success: boolean
  errorType?: string
  operation: string
}) {
  const cost = calculateInferenceCost(options.tokensUsed, options.responseTime)

  await prisma.usageStats.create({
    data: {
      userId,
      modelId,
      date: new Date(),
      requestCount: 1,
      tokenCount: options.tokensUsed,
      cost,
      responseTime: options.responseTime
    }
  })

  // Update creator earnings if successful
  if (options.success && cost > 0) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { creatorId: true }
    })

    if (model?.creatorId) {
      const creatorEarning = cost * 0.8 // 80% to creator
      await prisma.creatorProfile.update({
        where: { id: model.creatorId },
        data: {
          totalEarnings: { increment: creatorEarning }
        }
      })
    }
  }
}

// Helper function to estimate token count
function estimateTokenCount(input: any): number {
  if (typeof input === 'string') {
    // Rough estimation: ~0.75 tokens per word
    return Math.ceil(input.split(/\s+/).length * 0.75)
  } else if (Array.isArray(input)) {
    return input.reduce((sum, item) => sum + estimateTokenCount(item), 0)
  } else if (typeof input === 'object') {
    return estimateTokenCount(JSON.stringify(input))
  }
  return 1 // Minimum token count
}

// Helper function to calculate inference cost
function calculateInferenceCost(tokens: number, responseTimeMs: number): number {
  // Base cost: $0.002 per 1000 tokens (2x usage tracking rate for inference)
  const tokenCost = (tokens / 1000) * 0.002
  
  // Time premium: $0.0001 per second of processing
  const timeCost = (responseTimeMs / 1000) * 0.0001
  
  return Math.round((tokenCost + timeCost) * 100000) / 100000 // Round to 5 decimal places
}

// Replicate integration
async function runReplicateModel(modelId: string, inputs: any, options: any) {
  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured')
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: modelId,
        input: typeof inputs === 'string' ? { prompt: inputs } : inputs
      })
    })

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`)
    }

    const prediction = await response.json()
    
    // Poll for completion
    let result = prediction
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`
        }
      })
      
      result = await statusResponse.json()
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Replicate model failed')
    }

    return { output: result.output }
    
  } catch (error) {
    console.error('Replicate error:', error)
    throw error
  }
}

// Hugging Face integration
async function runHuggingFaceModel(modelId: string, inputs: any, options: any) {
  try {
    const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN
    if (!HF_API_TOKEN) {
      throw new Error('Hugging Face API token not configured')
    }

    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs,
        parameters: options
      })
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const result = await response.json()
    return { output: result }
    
  } catch (error) {
    console.error('Hugging Face error:', error)
    throw error
  }
}

// Helper function to generate mock response for testing
async function generateMockResponse(model: any, inputs: any, parameters?: any) {
  // Simulate processing time based on complexity
  const delay = Math.random() * 1500 + 500
  await new Promise(resolve => setTimeout(resolve, delay))

  if (model.category === 'LLM' || model.category === 'NLP') {
    return {
      output: `Generated response for "${typeof inputs === 'string' ? inputs : JSON.stringify(inputs)}". This is a mock response from ${model.name}. Parameters used: ${JSON.stringify(parameters || {})}.`,
      finishReason: 'stop',
      model: model.name
    }
  } else if (model.category === 'Computer Vision') {
    return {
      output: {
        predictions: [
          { label: 'cat', confidence: 0.95 },
          { label: 'dog', confidence: 0.89 },
          { label: 'animal', confidence: 0.98 }
        ],
        boundingBoxes: []
      }
    }
  } else {
    return {
      output: `Processed successfully by ${model.name}`,
      status: 'completed'
    }
  }
}

// Helper function to generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export with rate limiting - fix wrapper
export const POST = (req: NextRequest, context: { params: { id: string } }) => 
  withRateLimit(rateLimiters.inference, (request: NextRequest) => 
    runInferenceHandler(request, context)
  )(req)

export const GET = (req: NextRequest, context: { params: { id: string } }) => 
  withRateLimit(rateLimiters.general, (request: NextRequest) => 
    getInferenceStatusHandler(request, context)
  )(req) 