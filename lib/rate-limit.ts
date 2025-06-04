import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (in production, use Redis)
const store: RateLimitStore = {}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000) // Clean every minute

export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const identifier = getIdentifier(req)
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Initialize or get existing entry
    if (!store[identifier] || store[identifier].resetTime < now) {
      store[identifier] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }
    
    const entry = store[identifier]
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return NextResponse.json(
        { 
          error: config.message || 'Too many requests',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - entry.count - 1).toString(),
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
          }
        }
      )
    }
    
    // Increment counter
    entry.count++
    
    return null // Continue processing
  }
}

function getIdentifier(req: NextRequest): string {
  // Try to get IP from various headers (for proxies)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // Include user agent for additional uniqueness
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const hash = Buffer.from(ip + userAgent).toString('base64')
  
  return hash
}

// Predefined rate limiters
export const rateLimiters = {
  // General API calls
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later'
  }),
  
  // Authentication endpoints (stricter)
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts'
  }),
  
  // AI inference (most strict)
  inference: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Rate limit exceeded for AI inference'
  }),
  
  // Registration/signup
  registration: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts'
  }),
  
  // Password reset
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts'
  })
}

// Rate limit middleware wrapper
export function withRateLimit(
  rateLimit: (req: NextRequest) => Promise<NextResponse | null>,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const limitResponse = await rateLimit(req)
    if (limitResponse) {
      return limitResponse
    }
    return handler(req)
  }
} 