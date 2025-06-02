import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { helioService } from '@/lib/helio'
import { HelioWebhookPayload } from '@/lib/types'
import { subscriptionDb } from "@/lib/database"
import { helioApiClient } from "@/lib/helio"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('helio-signature')

    // TODO: Implement webhook signature verification when available
    // For now, we'll process all webhooks (add proper verification in production)
    
    const webhookData = JSON.parse(body)

    const { type, data } = webhookData

    switch (type) {
      case "PAYMENT_COMPLETED":
        await handlePaymentCompleted(data)
        break
        
      case "PAYMENT_FAILED":
        await handlePaymentFailed(data)
        break
        
      case "PAYMENT_REFUNDED":
        await handlePaymentRefunded(data)
        break
        
      default:
        console.log(`Unhandled Helio webhook type: ${type}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Helio webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function handlePaymentCompleted(data: any) {
  try {
    const { metadata } = data
    
    if (metadata.subscriptionType === "model_access") {
      // Create subscription for model access
      const durationHours = getDurationInHours(metadata.duration)
      
      const subscription = await subscriptionDb.createSubscription({
        userId: metadata.userId,
        modelId: metadata.modelId,
        planId: metadata.planId,
        durationHours,
        paymentMethod: "helio",
        transactionId: data.id
      })

      console.log(`Created subscription ${subscription.id} for user ${metadata.userId}`)
      
      // TODO: Send confirmation email to user
      // TODO: Update user's API access immediately
    }

  } catch (error) {
    console.error("Error handling payment completion:", error)
    throw error
  }
}

async function handlePaymentFailed(data: any) {
  try {
    console.log(`Payment failed for transaction ${data.id}`)
    
    // TODO: Log failed payment attempt
    // TODO: Send notification to user about failed payment
    
  } catch (error) {
    console.error("Error handling payment failure:", error)
  }
}

async function handlePaymentRefunded(data: any) {
  try {
    const { metadata } = data
    
    if (metadata.subscriptionType === "model_access") {
      // Find and cancel the subscription
      // TODO: Add method to cancel subscription by transaction ID
      console.log(`Refund processed for transaction ${data.id}`)
      
      // TODO: Immediately revoke API access
      // TODO: Send refund confirmation email
    }

  } catch (error) {
    console.error("Error handling payment refund:", error)
  }
}

function getDurationInHours(duration: string): number {
  switch (duration) {
    case "hourly": return 1
    case "daily": return 24
    case "weekly": return 168 // 24 * 7
    case "monthly": return 720 // 24 * 30
    default: return 24
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