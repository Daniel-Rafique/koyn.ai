import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subscriptionDb, modelDb } from '@/lib/database'
import { helioApiClient, helioService } from '@/lib/helio'
import { z } from 'zod'

const purchaseSchema = z.object({
  planId: z.string(),
  duration: z.enum(["hourly", "daily", "weekly", "monthly"]),
  paymentMethod: z.enum(["stripe", "helio"]),
  // Helio specific fields
  currency: z.enum(["SOL", "ETH", "USDC"]).optional(),
  // Stripe specific fields
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const modelId = params.id
    const body = await request.json()
    const { planId, duration, paymentMethod, currency, successUrl, cancelUrl } = 
      purchaseSchema.parse(body)

    // Get model and plan details
    const model = await modelDb.getModelById(modelId)
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    const plan = model.pricing.find((p: any) => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 })
    }

    // Check for existing active subscription
    const existingSubscription = await subscriptionDb.hasActiveSubscription(
      session.user.id,
      modelId
    )

    if (existingSubscription) {
      return NextResponse.json(
        { error: "You already have an active subscription for this model" },
        { status: 400 }
      )
    }

    // Calculate price based on duration
    const finalPrice = calculatePriceForDuration(plan.price, duration)

    if (paymentMethod === "helio") {
      return await handleHelioPayment({
        userId: session.user.id,
        modelId,
        planId,
        duration,
        model,
        plan,
        currency: currency || "USDC",
        amount: finalPrice
      })
    } else if (paymentMethod === "stripe") {
      return await handleStripePayment({
        userId: session.user.id,
        modelId,
        planId,
        duration,
        model,
        plan,
        amount: finalPrice,
        successUrl: successUrl || `${process.env.NEXTAUTH_URL}/models/${modelId}?success=true`,
        cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/models/${modelId}?canceled=true`
      })
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error processing purchase:", error)
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    )
  }
}

async function handleHelioPayment(data: {
  userId: string
  modelId: string
  planId: string
  duration: string
  model: any
  plan: any
  currency: string
  amount: number
}) {
  try {
    // Create Helio payment link
    const paymentLink = await helioApiClient.createPayLink({
      modelId: data.modelId,
      planId: data.planId,
      amount: data.amount,
      currency: data.currency as any,
      metadata: {
        userId: data.userId,
        modelId: data.modelId,
        planId: data.planId,
        duration: data.duration,
        subscriptionType: "model_access",
        productName: `${data.model.name} - ${data.duration} subscription`,
        productDescription: `Access to ${data.model.name} for ${data.duration}`
      }
    })

    return NextResponse.json({
      success: true,
      paymentMethod: "helio",
      paymentUrl: paymentLink.data?.url,
      amount: data.amount,
      currency: data.currency,
      duration: data.duration
    })

  } catch (error) {
    console.error("Helio payment error:", error)
    return NextResponse.json(
      { error: "Failed to create crypto payment" },
      { status: 500 }
    )
  }
}

async function handleStripePayment(data: {
  userId: string
  modelId: string
  planId: string
  duration: string
  model: any
  plan: any
  amount: number
  successUrl: string
  cancelUrl: string
}) {
  try {
    // For now, return a placeholder for Stripe integration
    // In a real implementation, you would create a Stripe checkout session
    return NextResponse.json({
      success: true,
      paymentMethod: "stripe",
      message: "Stripe integration coming soon",
      amount: data.amount,
      duration: data.duration,
      // This would be the actual Stripe checkout URL
      paymentUrl: `https://checkout.stripe.com/placeholder`,
      metadata: {
        userId: data.userId,
        modelId: data.modelId,
        planId: data.planId,
        duration: data.duration
      }
    })

  } catch (error) {
    console.error("Stripe payment error:", error)
    return NextResponse.json(
      { error: "Failed to create card payment" },
      { status: 500 }
    )
  }
}

function calculatePriceForDuration(basePrice: number, duration: string): number {
  switch (duration) {
    case "hourly": return basePrice * 0.05 // 5% of base price per hour
    case "daily": return basePrice * 0.1   // 10% of base price per day
    case "weekly": return basePrice * 0.3  // 30% of base price per week
    case "monthly": return basePrice       // Base price is monthly
    default: return basePrice
  }
}

// Get purchase status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      )
    }

    // Get payment status from Helio
    const paymentStatus = await helioService.getPaymentStatus(paymentId)

    return NextResponse.json({  
      success: true,
      data: paymentStatus
    })

  } catch (error) {
    console.error('Error fetching payment status:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 