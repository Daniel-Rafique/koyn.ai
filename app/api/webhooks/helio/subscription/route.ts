import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { helioService } from '@/lib/helio'
import { HelioWebhookPayload } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const headersList = await headers()
    
    // Get the authorization header (contains the shared token)
    const authHeader = headersList.get('authorization')
    const signature = headersList.get('x-helio-signature')
    
    if (!authHeader) {
      console.error('Missing authorization header for subscription webhook')
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    // Extract the shared token from the authorization header
    const sharedToken = authHeader.replace('Bearer ', '')
    
    // Verify the webhook signature if available
    if (signature && !helioService.verifyWebhookSignature(body, signature, sharedToken)) {
      console.error('Invalid webhook signature for subscription')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the webhook payload
    let payload: HelioWebhookPayload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON payload for subscription webhook:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate the payload structure
    if (!payload.event || !payload.transactionObject) {
      console.error('Invalid subscription webhook payload structure:', payload)
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      )
    }

    // Validate that this is a subscription event
    const validSubscriptionEvents = ['STARTED', 'RENEWED', 'ENDED']
    if (!validSubscriptionEvents.includes(payload.event)) {
      console.error('Invalid subscription event type:', payload.event)
      return NextResponse.json(
        { error: 'Invalid subscription event type' },
        { status: 400 }
      )
    }

    console.log(`Processing Helio subscription webhook: ${payload.event}`, {
      transactionId: payload.transactionObject.id,
      paylinkId: payload.transactionObject.paylinkId,
      subscriptionEvent: payload.event
    })

    // Process the subscription webhook
    const payment = await helioService.processWebhook(payload)

    // Handle subscription-specific logic based on event type
    switch (payload.event) {
      case 'STARTED':
        console.log('Subscription started:', {
          paymentId: payment.id,
          modelId: payment.modelId,
          userId: payment.userId
        })
        // Here you would:
        // - Create subscription record in database
        // - Grant access to the model
        // - Send welcome email
        // - Update creator earnings
        break

      case 'RENEWED':
        console.log('Subscription renewed:', {
          paymentId: payment.id,
          modelId: payment.modelId,
          userId: payment.userId
        })
        // Here you would:
        // - Extend subscription period
        // - Update creator earnings
        // - Send renewal confirmation
        break

      case 'ENDED':
        console.log('Subscription ended:', {
          paymentId: payment.id,
          modelId: payment.modelId,
          userId: payment.userId
        })
        // Here you would:
        // - Revoke access to the model
        // - Update subscription status
        // - Send cancellation email
        break
    }

    // Log the successful processing
    console.log('Subscription webhook processed successfully:', {
      paymentId: payment.id,
      event: payload.event,
      transactionSignature: payment.transactionSignature
    })

    // Return success response
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
    
    // Return error response
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