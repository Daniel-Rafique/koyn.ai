import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions, Permission } from '@/lib/rbac'
import { helioTestService } from '@/lib/helio-test'

// GET - Test Helio configuration and credentials
export async function GET(request: NextRequest) {
  // Check admin permissions
  const authResult = await requirePermissions(request, [Permission.ADMIN_SYSTEM])
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'

    switch (action) {
      case 'status':
        // Get configuration status
        const credentialsTest = await helioTestService.testCredentials()
        const configSummary = helioTestService.getConfigSummary()
        const signatureTest = helioTestService.testWebhookSignature()

        return NextResponse.json({
          success: true,
          data: {
            credentials: credentialsTest,
            configuration: configSummary,
            webhookSignature: signatureTest,
            sampleWebhook: helioTestService.generateSampleWebhook(),
            timestamp: new Date().toISOString()
          }
        })

      case 'create-test-payment':
        // Create a test payment link
        const paymentResult = await helioTestService.createTestPayment()
        return NextResponse.json({
          success: paymentResult.success,
          data: paymentResult,
          message: paymentResult.success 
            ? 'Test payment link created successfully' 
            : 'Failed to create test payment link'
        })

      case 'create-test-subscription':
        // Create a test subscription link
        const subscriptionResult = await helioTestService.createTestSubscription()
        return NextResponse.json({
          success: subscriptionResult.success,
          data: subscriptionResult,
          message: subscriptionResult.success 
            ? 'Test subscription link created successfully' 
            : 'Failed to create test subscription link'
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Helio test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test Helio integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Test webhook processing
export async function POST(request: NextRequest) {
  // Check admin permissions
  const authResult = await requirePermissions(request, [Permission.ADMIN_SYSTEM])
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { action, event } = body

    switch (action) {
      case 'test-webhook':
        // Generate and process a test webhook
        const sampleWebhook = helioTestService.generateSampleWebhook(event || 'CREATED')
        
        // This would normally be processed by the webhook endpoint
        console.log('🧪 Testing webhook processing:', sampleWebhook)
        
        return NextResponse.json({
          success: true,
          data: {
            webhook: sampleWebhook,
            message: 'Test webhook generated successfully',
            note: 'This is a simulated webhook - in production it would be sent by Helio'
          }
        })

      case 'validate-credentials':
        // Validate Helio credentials
        const credentialsTest = await helioTestService.testCredentials()
        
        return NextResponse.json({
          success: credentialsTest.valid,
          data: credentialsTest,
          message: credentialsTest.valid 
            ? 'Helio credentials are properly configured' 
            : 'Helio credentials have issues'
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Helio test POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process Helio test request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 