import { NextRequest, NextResponse } from 'next/server'
import { helioService } from '@/lib/helio'
import { HelioWebhookPayload } from '@/lib/types'
import { helioPaymentHandler } from '@/lib/helio-payment-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const authHeader = request.headers.get('authorization')

    // Verify webhook signature using Bearer token
    const sharedToken = process.env.HELIO_WEBHOOK_SECRET
    
    if (!sharedToken) {
      console.error('HELIO_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization' },
        { status: 401 }
      )
    }

    // Verify the signature matches our shared token
    const isValidSignature = helioService.verifyWebhookSignature(body, authHeader, sharedToken)
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    const payload: HelioWebhookPayload = JSON.parse(body)
    
    console.log('🔄 Helio subscription webhook received:', {
      event: payload.event,
      subscriptionId: payload.transactionObject.id,
      paylinkId: payload.transactionObject.paylinkId,
      status: payload.transactionObject.meta.transactionStatus
    })

    // Process the webhook through our service
    const payment = await helioService.processWebhook(payload)

    // Handle subscription-specific events using comprehensive handlers
    let result: { success: boolean; subscriptionId?: string; error?: string }

    switch (payload.event) {
      case 'STARTED':
        result = await helioPaymentHandler.handleSubscriptionStarted(payment, payload)
        break
      case 'RENEWED':
        result = await helioPaymentHandler.handleSubscriptionRenewed(payment, payload)
        break
      case 'ENDED':
        result = await helioPaymentHandler.handleSubscriptionEnded(payment, payload)
        break
      default:
        console.log(`Unhandled subscription event: ${payload.event}`)
        result = { success: true }
    }

    if (!result.success) {
      console.error(`Subscription ${payload.event} processing failed:`, result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Subscription ${payload.event.toLowerCase()} processed successfully`,
      data: {
        paymentId: payment.id,
        event: payload.event,
        subscriptionId: result.subscriptionId
      }
    })

  } catch (error) {
    console.error('Error processing Helio subscription webhook:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for webhook events.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for webhook events.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for webhook events.' },
    { status: 405 }
  )
} 