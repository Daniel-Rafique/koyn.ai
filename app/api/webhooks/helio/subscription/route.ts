import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { helioService } from '@/lib/helio'
import { HelioWebhookPayload } from '@/lib/types'

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

    // Handle subscription-specific events
    switch (payload.event) {
      case 'STARTED':
        await handleSubscriptionStarted(payment, payload)
        break
      case 'RENEWED':
        await handleSubscriptionRenewed(payment, payload)
        break
      case 'ENDED':
        await handleSubscriptionEnded(payment, payload)
        break
      default:
        console.log(`Unhandled subscription event: ${payload.event}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription webhook processed successfully',
      data: {
        paymentId: payment.id,
        event: payload.event,
        subscriptionEvent: payload.event
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

async function handleSubscriptionStarted(payment: any, payload: HelioWebhookPayload) {
  try {
    console.log('🚀 Subscription started:', payment.id)
    
    // TODO: Implementation:
    // 1. Create subscription record in database
    // 2. Grant user access to the model
    // 3. Send welcome email
    // 4. Update creator earnings
    // 5. Log analytics event
    
    console.log(`✅ Subscription started for model ${payment.modelId}`)
    
  } catch (error) {
    console.error('Failed to handle subscription start:', error)
    throw error
  }
}

async function handleSubscriptionRenewed(payment: any, payload: HelioWebhookPayload) {
  try {
    console.log('🔄 Subscription renewed:', payment.id)
    
    // TODO: Implementation:
    // 1. Update subscription end date
    // 2. Reset usage counters
    // 3. Process payment to creator
    // 4. Send renewal confirmation
    
    console.log(`✅ Subscription renewed for model ${payment.modelId}`)
    
  } catch (error) {
    console.error('Failed to handle subscription renewal:', error)
    throw error
  }
}

async function handleSubscriptionEnded(payment: any, payload: HelioWebhookPayload) {
  try {
    console.log('🛑 Subscription ended:', payment.id)
    
    // TODO: Implementation:
    // 1. Update subscription status to ended
    // 2. Revoke user access to the model
    // 3. Send cancellation confirmation
    // 4. Archive usage data
    
    console.log(`✅ Subscription ended for model ${payment.modelId}`)
    
  } catch (error) {
    console.error('Failed to handle subscription end:', error)
    throw error
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