import crypto from 'crypto'
import { prisma } from './database'

// Generate a secure API key
export function generateApiKey(): { key: string; hash: string } {
  const key = `kyn_${crypto.randomBytes(32).toString('hex')}`
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return { key, hash }
}

// Create a new API key for a user
export async function createApiKey(
  userId: string, 
  name: string, 
  rateLimit: number = 1000,
  expiresInDays?: number
) {
  const { key, hash } = generateApiKey()
  
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined

  const keyData = await prisma.aPIKey.create({
    data: {
      name,
      keyHash: hash,
      userId,
      rateLimit,
      expiresAt,
      isActive: true
    }
  })

  return { apiKey: key, keyData }
}

// Validate an API key
export async function validateApiKey(key: string) {
  try {
    if (!key?.startsWith('kyn_')) {
      return { valid: false, error: 'Invalid API key format' }
    }

    const keyHash = crypto.createHash('sha256').update(key).digest('hex')
    const apiKey = await prisma.aPIKey.findUnique({
      where: { keyHash },
      include: { user: true }
    })

    if (!apiKey) {
      return { valid: false, error: 'API key not found' }
    }

    if (!apiKey.isActive) {
      return { valid: false, error: 'API key is disabled' }
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Update last used timestamp
    await prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() }
    })

    return {
      valid: true,
      userId: apiKey.userId,
      rateLimit: apiKey.rateLimit
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Validation failed' }
  }
}

// API key middleware for route protection
export async function withApiKeyAuth(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return { authorized: false, error: 'Authorization header required' }
    }

    const [bearer, token] = authHeader.split(' ')
    
    if (bearer !== 'Bearer' || !token) {
      return { authorized: false, error: 'Invalid authorization format. Use: Bearer <api_key>' }
    }

    const validation = await validateApiKey(token)
    
    if (!validation.valid || !validation.userId) {
      return { authorized: false, error: validation.error || 'Invalid API key' }
    }

    return { 
      authorized: true, 
      userId: validation.userId,
      rateLimit: validation.rateLimit
    }
  } catch (error) {
    console.error('API key auth error:', error)
    return { authorized: false, error: 'Authentication failed' }
  }
} 