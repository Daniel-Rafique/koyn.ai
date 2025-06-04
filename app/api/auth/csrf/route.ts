import { NextResponse } from 'next/server'
import { getCSRFToken } from '@/lib/csrf'

export async function GET() {
  try {
    const csrfToken = await getCSRFToken()
    
    if (!csrfToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json({ csrfToken })
  } catch (error) {
    console.error('Error getting CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
} 