import { prisma } from './database'
import { HelioPayment, HelioWebhookPayload } from './types'
import { subscriptionDb, modelDb } from './database'

export class HelioPaymentHandler {
  
  // Complete payment processing and grant user access
  async handlePaymentCompleted(payment: HelioPayment, payload: HelioWebhookPayload): Promise<{
    success: boolean
    subscriptionId?: string
    error?: string
  }> {
    try {
      console.log('💰 Processing Helio payment completion:', payment.id)

      // Extract metadata from the webhook payload
      const metadata = this.extractMetadata(payload)
      
      if (!metadata.modelId || !metadata.planId || !metadata.userId) {
        throw new Error('Missing required metadata in payment: modelId, planId, or userId')
      }

      // Verify the model and plan exist
      const model = await modelDb.getModelById(metadata.modelId)
      if (!model) {
        throw new Error(`Model not found: ${metadata.modelId}`)
      }

      const plan = model.pricing?.find((p: any) => p.id === metadata.planId)
      if (!plan) {
        throw new Error(`Pricing plan not found: ${metadata.planId}`)
      }

      // Calculate subscription duration based on plan
      const durationHours = this.calculateDurationHours(plan.unit)

      // Create subscription in database
      const subscription = await subscriptionDb.createSubscription({
        userId: metadata.userId,
        modelId: metadata.modelId,
        planId: metadata.planId,
        durationHours,
        paymentMethod: 'helio',
        transactionId: payment.transactionSignature
      })

      // Update creator earnings
      await this.updateCreatorEarnings({
        creatorId: model.creatorId,
        modelId: metadata.modelId,
        amount: payment.amount,
        currency: payment.currency,
        subscriptionId: subscription.id,
        transactionId: payment.transactionSignature
      })

      // Log the successful payment
      await this.logPaymentEvent({
        eventType: 'payment_completed',
        userId: metadata.userId,
        modelId: metadata.modelId,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionSignature,
        subscriptionId: subscription.id
      })

      console.log(`✅ Payment completed: ${payment.id} -> Subscription: ${subscription.id}`)

      return {
        success: true,
        subscriptionId: subscription.id
      }

    } catch (error) {
      console.error('Failed to process payment completion:', error)
      
      // Log the error for debugging
      await this.logPaymentEvent({
        eventType: 'payment_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentData: payment
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Handle subscription started (recurring payments)
  async handleSubscriptionStarted(payment: HelioPayment, payload: HelioWebhookPayload): Promise<{
    success: boolean
    subscriptionId?: string
    error?: string
  }> {
    try {
      console.log('🚀 Processing Helio subscription start:', payment.id)

      const metadata = this.extractMetadata(payload)
      
      if (!metadata.modelId || !metadata.planId || !metadata.userId) {
        throw new Error('Missing required metadata in subscription: modelId, planId, or userId')
      }

      // For subscriptions, create a longer-term subscription
      const subscription = await subscriptionDb.createSubscription({
        userId: metadata.userId,
        modelId: metadata.modelId,
        planId: metadata.planId,
        durationHours: 720, // 30 days for monthly subscriptions
        paymentMethod: 'helio',
        transactionId: payment.transactionSignature
      })

      // Update creator earnings
      await this.updateCreatorEarnings({
        creatorId: metadata.creatorId || '',
        modelId: metadata.modelId,
        amount: payment.amount,
        currency: payment.currency,
        subscriptionId: subscription.id,
        transactionId: payment.transactionSignature,
        isRecurring: true
      })

      console.log(`✅ Subscription started: ${payment.id} -> Subscription: ${subscription.id}`)

      return {
        success: true,
        subscriptionId: subscription.id
      }

    } catch (error) {
      console.error('Failed to process subscription start:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Handle subscription renewal
  async handleSubscriptionRenewed(payment: HelioPayment, payload: HelioWebhookPayload): Promise<{
    success: boolean
    subscriptionId?: string
    error?: string
  }> {
    try {
      console.log('🔄 Processing Helio subscription renewal:', payment.id)

      const metadata = this.extractMetadata(payload)
      
      // Find existing subscription and extend it
      const existingSubscriptions = await subscriptionDb.getUserSubscriptions(metadata.userId, true)
      const targetSubscription = existingSubscriptions.find(s => s.modelId === metadata.modelId)

      if (!targetSubscription) {
        throw new Error('No active subscription found for renewal')
      }

      // Extend subscription period by 30 days
      const newEndDate = new Date(targetSubscription.currentPeriodEnd)
      newEndDate.setDate(newEndDate.getDate() + 30)

      await prisma.subscription.update({
        where: { id: targetSubscription.id },
        data: {
          currentPeriodEnd: newEndDate.toISOString(),
          updatedAt: new Date()
        }
      })

      // Update creator earnings for renewal
      await this.updateCreatorEarnings({
        creatorId: metadata.creatorId || '',
        modelId: metadata.modelId,
        amount: payment.amount,
        currency: payment.currency,
        subscriptionId: targetSubscription.id,
        transactionId: payment.transactionSignature,
        isRenewal: true
      })

      console.log(`✅ Subscription renewed: ${payment.id} -> Extended until: ${newEndDate}`)

      return {
        success: true,
        subscriptionId: targetSubscription.id
      }

    } catch (error) {
      console.error('Failed to process subscription renewal:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Handle subscription ended
  async handleSubscriptionEnded(payment: HelioPayment, payload: HelioWebhookPayload): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      console.log('🛑 Processing Helio subscription end:', payment.id)

      const metadata = this.extractMetadata(payload)
      
      // Find and cancel the subscription
      const existingSubscriptions = await subscriptionDb.getUserSubscriptions(metadata.userId, true)
      const targetSubscription = existingSubscriptions.find(s => s.modelId === metadata.modelId)

      if (targetSubscription) {
        await subscriptionDb.updateSubscriptionStatus(targetSubscription.id, 'CANCELLED')
        console.log(`✅ Subscription ended: ${targetSubscription.id}`)
      }

      return { success: true }

    } catch (error) {
      console.error('Failed to process subscription end:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Check if user has access to a model
  async checkUserAccess(userId: string, modelId: string): Promise<{
    hasAccess: boolean
    subscription?: any
    expiresAt?: Date
  }> {
    try {
      const subscription = await subscriptionDb.hasActiveSubscription(userId, modelId)
      
      return {
        hasAccess: !!subscription,
        subscription,
        expiresAt: subscription ? new Date(subscription.currentPeriodEnd) : undefined
      }

    } catch (error) {
      console.error('Failed to check user access:', error)
      return { hasAccess: false }
    }
  }

  // Private helper methods
  private extractMetadata(payload: HelioWebhookPayload): {
    modelId: string
    planId: string
    userId: string
    creatorId?: string
  } {
    try {
      const { transactionObject } = payload
      const customerEmail = transactionObject.meta.customerDetails?.email
      
      // Extract metadata from the webhook payload
      // Helio allows custom metadata to be attached to payments
      // We'll look for our custom fields or fall back to extracting from customer details
      
      // Try to get from metadata first (if we stored it when creating the payment)
      const metadata = transactionObject.meta as any
      
      // Extract model ID - could be in metadata or payment ID structure
      let modelId = metadata.modelId || 'unknown_model'
      let planId = metadata.planId || 'unknown_plan'
      let userId = 'unknown_user'
      
      // Try to extract user ID from customer email by looking up in database
      if (customerEmail) {
        // For now, we'll use email as a temporary identifier
        // In a real implementation, you'd look up the user by email
        userId = customerEmail
      }
      
      // Extract from transaction structure if available
      if (transactionObject.paylinkId) {
        // Parse paylink ID if it contains our custom format
        // Example: "model_abc123_plan_def456_user_ghi789"
        const parts = transactionObject.paylinkId.split('_')
        if (parts.length >= 6) {
          modelId = parts[1] || modelId
          planId = parts[3] || planId
          userId = parts[5] || userId
        }
      }
      
      console.log('📋 Extracted metadata:', {
        modelId,
        planId,
        userId,
        customerEmail,
        paylinkId: transactionObject.paylinkId
      })
      
      return {
        modelId,
        planId,
        userId,
        creatorId: undefined // Will be populated from model data
      }
      
    } catch (error) {
      console.error('Failed to extract metadata from webhook:', error)
      
      // Return defaults to prevent complete failure
      return {
        modelId: 'fallback_model',
        planId: 'fallback_plan',
        userId: 'fallback_user'
      }
    }
  }

  // Improved user lookup by email
  private async getUserByEmail(email: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      })
      
      return user?.id || null
    } catch (error) {
      console.error('Failed to lookup user by email:', error)
      return null
    }
  }

  // Create a proper payment record for tracking
  private async createPaymentRecord(payment: HelioPayment, metadata: {
    modelId: string
    planId: string
    userId: string
  }): Promise<string> {
    try {
      // Create a payment tracking record
      const paymentRecord = await prisma.order.create({
        data: {
          userId: metadata.userId,
          total: payment.amount,
          status: 'COMPLETED',
          paymentMethod: 'HELIO',
          helioTransactionId: payment.transactionSignature,
          completedAt: new Date(),
          items: {
            create: {
              modelId: metadata.modelId,
              planId: metadata.planId,
              quantity: 1,
              unitPrice: payment.amount,
              totalPrice: payment.amount
            }
          }
        }
      })
      
      console.log(`💳 Payment record created: ${paymentRecord.id}`)
      return paymentRecord.id
      
    } catch (error) {
      console.error('Failed to create payment record:', error)
      throw error
    }
  }

  private calculateDurationHours(unit: string): number {
    const unitLower = unit.toLowerCase()
    
    if (unitLower.includes('hour')) return 1
    if (unitLower.includes('day')) return 24
    if (unitLower.includes('week')) return 168 // 24 * 7
    if (unitLower.includes('month')) return 720 // 24 * 30
    if (unitLower.includes('year')) return 8760 // 24 * 365
    
    return 24 // Default to 1 day
  }

  private async updateCreatorEarnings(data: {
    creatorId: string
    modelId: string
    amount: number
    currency: string
    subscriptionId: string
    transactionId?: string
    isRecurring?: boolean
    isRenewal?: boolean
  }) {
    try {
      // Calculate platform fee (20% platform, 80% creator based on schema default)
      const platformFeeRate = 0.20 // Use schema default
      const platformFee = data.amount * platformFeeRate
      const creatorEarnings = data.amount - platformFee

      // Update or create creator earnings record
      await prisma.earnings.upsert({
        where: { creatorId: data.creatorId },
        update: {
          totalEarnings: {
            increment: creatorEarnings
          },
          currentMonthEarnings: {
            increment: creatorEarnings
          },
          lifetimeEarnings: {
            increment: creatorEarnings
          }
        },
        create: {
          creatorId: data.creatorId,
          totalEarnings: creatorEarnings,
          currentMonthEarnings: creatorEarnings,
          lifetimeEarnings: creatorEarnings,
          pendingPayouts: 0,
          revenueShare: 20 // Platform fee percentage
        }
      })

      console.log(`💰 Creator earnings updated: ${creatorEarnings} ${data.currency} for ${data.creatorId}`)

    } catch (error) {
      console.error('Failed to update creator earnings:', error)
      // Don't throw - earnings update shouldn't fail the payment
    }
  }

  private async logPaymentEvent(eventData: {
    eventType: string
    userId?: string
    modelId?: string
    amount?: number
    currency?: string
    transactionId?: string
    subscriptionId?: string
    error?: string
    paymentData?: any
  }) {
    try {
      // Log to analytics or audit table
      console.log('📊 Payment Event:', {
        type: eventData.eventType,
        timestamp: new Date().toISOString(),
        ...eventData
      })

      // TODO: Implement proper analytics logging
      // await analytics.track(eventData.eventType, eventData)

    } catch (error) {
      console.error('Failed to log payment event:', error)
      // Don't throw - logging shouldn't fail the payment
    }
  }
}

// Export singleton instance
export const helioPaymentHandler = new HelioPaymentHandler() 