import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { helioService } from '@/lib/helio'
import { HelioWebhookPayload } from '@/lib/types'
import { subscriptionDb } from "@/lib/database"
import { helioApiClient } from "@/lib/helio"

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

    // Handle specific payment events
    switch (webhookData.event) {
      case "CREATED":
        await handlePaymentCompleted(payment)
        break
      default:
        console.log(`Helio webhook event '${webhookData.event}' processed successfully`)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      paymentId: payment.id
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

async function handlePaymentCompleted(payment: any) {
  try {
    console.log('💰 Processing completed payment:', payment.id)
    
    // TODO: Implement payment completion logic:
    // 1. Create/update subscription record in database
    // 2. Grant user access to the model
    // 3. Update creator earnings
    // 4. Send confirmation email
    // 5. Log analytics event
    
    // For now, just log the event
    console.log(`✅ Payment ${payment.id} processed for model ${payment.modelId}`)
    
  } catch (error) {
    console.error(`Failed to process payment completion for ${payment.id}:`, error)
    throw error
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