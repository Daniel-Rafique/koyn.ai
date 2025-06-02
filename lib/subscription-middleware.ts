import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { subscriptionDb } from "./database"

export async function checkSubscriptionAccess(
  request: NextRequest,
  modelId: string
): Promise<NextResponse | null> {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if user has active subscription for this model
    const subscription = await subscriptionDb.hasActiveSubscription(
      session.user.id,
      modelId
    )

    if (!subscription) {
      return NextResponse.json(
        { 
          error: "Active subscription required",
          message: "Please subscribe to access this model",
          modelId,
          subscriptionRequired: true
        },
        { status: 403 }
      )
    }

    // Check if subscription is about to expire (< 1 hour remaining)
    const timeRemaining = subscription.currentPeriodEnd.getTime() - Date.now()
    const hoursRemaining = timeRemaining / (1000 * 60 * 60)

    if (hoursRemaining < 1) {
      // Add warning header but allow access
      const response = NextResponse.next()
      response.headers.set("X-Subscription-Expiring", "true")
      response.headers.set("X-Hours-Remaining", hoursRemaining.toString())
      return response
    }

    // Subscription is valid, continue
    return null

  } catch (error) {
    console.error("Subscription check error:", error)
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    )
  }
}

export async function trackApiUsage(
  userId: string,
  modelId: string,
  requestData: {
    tokenCount?: number
    responseTime?: number
    requestType?: string
  }
): Promise<void> {
  try {
    // TODO: Implement usage tracking
    // This would track API calls, tokens used, response times, etc.
    // for billing and analytics purposes
    
    console.log(`API usage: User ${userId}, Model ${modelId}`, requestData)
    
    // In a real implementation, you would:
    // 1. Store usage stats in the database
    // 2. Check against rate limits
    // 3. Calculate costs
    // 4. Update usage counters
    
  } catch (error) {
    console.error("Usage tracking error:", error)
    // Don't fail the request if usage tracking fails
  }
}

export async function getRemainingCredits(
  userId: string,
  modelId: string
): Promise<{
  subscription: any
  timeRemaining: number
  usageToday: number
  limits: {
    requestsPerMinute: number | null
    requestsPerMonth: number | null
  }
}> {
  try {
    const subscription = await subscriptionDb.hasActiveSubscription(userId, modelId)
    
    if (!subscription) {
      throw new Error("No active subscription")
    }

    const timeRemaining = subscription.currentPeriodEnd.getTime() - Date.now()
    
    // TODO: Get actual usage stats from database
    const usageToday = 0 // Placeholder
    
    return {
      subscription,
      timeRemaining,
      usageToday,
      limits: {
        requestsPerMinute: subscription.plan.requestsPerMinute,
        requestsPerMonth: subscription.plan.requestsPerMonth
      }
    }

  } catch (error) {
    console.error("Error getting remaining credits:", error)
    throw error
  }
} 