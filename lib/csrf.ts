import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import crypto from 'crypto'

// Generate CSRF token
export function generateCSRFToken(sessionId: string): string {
  const secret = process.env.NEXTAUTH_SECRET!
  const hash = crypto.createHmac('sha256', secret)
  hash.update(sessionId + Date.now().toString())
  return hash.digest('hex')
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionId: string): boolean {
  if (!token || !sessionId) return false
  
  const secret = process.env.NEXTAUTH_SECRET!
  
  // Token format: hash-timestamp
  const [hash, timestamp] = token.split('-')
  if (!hash || !timestamp) return false
  
  // Check if token is too old (1 hour max)
  const tokenAge = Date.now() - parseInt(timestamp)
  if (tokenAge > 3600000) return false // 1 hour in milliseconds
  
  // Recreate expected hash
  const expectedHash = crypto.createHmac('sha256', secret)
  expectedHash.update(sessionId + timestamp)
  
  return hash === expectedHash.digest('hex')
}

// CSRF protection middleware for API routes
export async function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for GET requests and webhook endpoints
    if (req.method === 'GET' || req.nextUrl.pathname.includes('/webhooks/')) {
      return handler(req)
    }

    try {
      // Get session
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check CSRF token
      const csrfToken = req.headers.get('x-csrf-token') || 
                       req.headers.get('X-CSRF-Token')
      
      if (!csrfToken) {
        return NextResponse.json(
          { error: 'CSRF token required' },
          { status: 403 }
        )
      }

      if (!validateCSRFToken(csrfToken, session.user.id)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }

      return handler(req)
    } catch (error) {
      console.error('CSRF protection error:', error)
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }
  }
}

// Generate CSRF token for client
export async function getCSRFToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null
    
    const timestamp = Date.now().toString()
    const secret = process.env.NEXTAUTH_SECRET!
    const hash = crypto.createHmac('sha256', secret)
    hash.update(session.user.id + timestamp)
    
    return `${hash.digest('hex')}-${timestamp}`
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return null
  }
} 