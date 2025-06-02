import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { subscriptionDb, modelDb } from "@/lib/database"
import { z } from "zod"

const createSubscriptionSchema = z.object({
  modelId: z.string(),
  planId: z.string(),
  duration: z.enum(["hourly", "daily", "weekly", "monthly"]),
  paymentMethod: z.enum(["stripe", "helio", "crypto"]).optional(),
  helioTransactionId: z.string().optional(),
  stripeSubscriptionId: z.string().optional()
})

// GET /api/subscriptions - Get user's subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") === "true"
    
    const subscriptions = await subscriptionDb.getUserSubscriptions(
      session.user.id, 
      activeOnly
    )

    return NextResponse.json({
      success: true,
      subscriptions
    })

  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { modelId, planId, duration, paymentMethod, helioTransactionId, stripeSubscriptionId } = 
      createSubscriptionSchema.parse(body)

    // Check if model exists
    const model = await modelDb.getModelById(modelId)
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    // Find the pricing plan
    const plan = model.pricing.find((p: any) => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 })
    }

    // Calculate subscription duration in hours
    const durationHours = getDurationInHours(duration)
    
    // Check for existing active subscription
    const existingSubscription = await subscriptionDb.hasActiveSubscription(
      session.user.id, 
      modelId
    )

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Active subscription already exists for this model" },
        { status: 400 }
      )
    }

    // Create subscription
    const subscription = await subscriptionDb.createSubscription({
      userId: session.user.id,
      modelId,
      planId,
      durationHours,
      paymentMethod: paymentMethod || "stripe",
      transactionId: helioTransactionId || stripeSubscriptionId
    })

    return NextResponse.json({
      success: true,
      message: "Subscription created successfully",
      subscription
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    )
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