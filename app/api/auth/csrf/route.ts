import { NextResponse } from 'next/server'
import { getCSRFToken } from '@/lib/csrf'
import crypto from 'crypto'

export async function GET() {
  try {
    // Try to get authenticated CSRF token
    const csrfToken = await getCSRFToken()
    
    if (csrfToken) {
      return NextResponse.json({ csrfToken })
    }
    
    // Generate temporary token for unauthenticated sessions (for OAuth flow)
    const tempSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const timestamp = Date.now().toString()
    const hash = crypto.createHmac('sha256', tempSecret)
    hash.update('temp-session-' + timestamp)
    const tempToken = `${hash.digest('hex')}-${timestamp}`
    
    return NextResponse.json({ csrfToken: tempToken })
  } catch (error) {
    console.error('Error getting CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
} 