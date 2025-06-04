import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { validateEnvironment } from '@/lib/env-validation'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Validate environment
    const envStatus = validateEnvironment()
    
    // Test database connectivity
    const dbStart = Date.now()
    const userCount = await prisma.user.count()
    const modelCount = await prisma.model.count()
    const dbTime = Date.now() - dbStart
    
    // Test external services (non-blocking)
    const serviceChecks = await Promise.allSettled([
      // Test OpenAI API
      fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(5000)
      }).then(r => ({ openai: r.ok })).catch(() => ({ openai: false })),
      
      // Test Hugging Face API
      fetch('https://huggingface.co/api/models', {
        headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        signal: AbortSignal.timeout(5000)
      }).then(r => ({ huggingface: r.ok })).catch(() => ({ huggingface: false })),
    ])
    
    const externalServices = serviceChecks.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        return { ...acc, ...result.value }
      }
      return acc
    }, {})
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      responseTime: `${responseTime}ms`,
      database: {
        connected: true,
        queryTime: `${dbTime}ms`,
        users: userCount,
        models: modelCount,
      },
      environment_validation: envStatus,
      external_services: externalServices,
      version: process.env.npm_package_version || '1.0.0',
    })
    
  } catch (error: any) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: error.message,
      responseTime: `${Date.now() - startTime}ms`,
    }, { status: 503 })
  }
} 