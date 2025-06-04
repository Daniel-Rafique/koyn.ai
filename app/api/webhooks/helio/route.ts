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
    const webhookData: HelioWebhookPayload = JSON.parse(body)
    
    console.log('🪙 Helio webhook received:', {
      event: webhookData.event,
      transactionId: webhookData.transactionObject.id,
      paylinkId: webhookData.transactionObject.paylinkId,
      status: webhookData.transactionObject.meta.transactionStatus
    })

    // Process the webhook through our service
    const payment = await helioService.processWebhook(webhookData)

    // Handle payment completion using the comprehensive handler
    const result = await helioPaymentHandler.handlePaymentCompleted(payment, webhookData)

    if (!result.success) {
      console.error('Payment completion failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment processed successfully',
      paymentId: payment.id,
      subscriptionId: result.subscriptionId
    })

  } catch (error) {
    console.error("Helio webhook error:", error)
    return NextResponse.json(
      { 
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
} 