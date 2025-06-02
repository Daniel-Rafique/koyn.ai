import { HelioWebhookPayload, HelioPayment, PricingPlan } from './types'
import { HELIO_CONFIG } from './constants'
import { APIClient, APIError } from './api'

// Helio API client
class HelioAPIClient extends APIClient {
  private apiKey: string
  private apiSecret: string
  private environment: 'production' | 'development'

  constructor() {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    const baseURL = environment === 'production' 
      ? HELIO_CONFIG.PRODUCTION_API 
      : HELIO_CONFIG.DEVELOPMENT_API

    super(baseURL)
    
    this.environment = environment
    this.apiKey = process.env.HELIO_API_KEY || ''
    this.apiSecret = process.env.HELIO_API_SECRET || ''
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('Helio API credentials not configured')
    }
  }

  // Create a pay link for a model
  async createPayLink(data: {
    modelId: string
    planId: string
    amount: number
    currency: string
    customerEmail?: string
    successUrl?: string
    cancelUrl?: string
    metadata?: Record<string, any>
  }) {
    const payload = {
      amount: data.amount,
      currency: data.currency,
      successUrl: data.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: data.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      customerEmail: data.customerEmail,
      metadata: {
        modelId: data.modelId,
        planId: data.planId,
        ...data.metadata
      }
    }

    return this.post<{ id: string; url: string }>('/paylink', payload, {
      Authorization: `Bearer ${this.apiSecret}`
    })
  }

  // Create a subscription pay link
  async createSubscriptionPayLink(data: {
    modelId: string
    planId: string
    amount: number
    currency: string
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
    customerEmail?: string
    trialDays?: number
    metadata?: Record<string, any>
  }) {
    const payload = {
      amount: data.amount,
      currency: data.currency,
      recurring: {
        interval: data.interval,
        trialDays: data.trialDays || 0
      },
      customerEmail: data.customerEmail,
      metadata: {
        modelId: data.modelId,
        planId: data.planId,
        ...data.metadata
      }
    }

    return this.post<{ id: string; url: string }>('/paylink/subscription', payload, {
      Authorization: `Bearer ${this.apiSecret}`
    })
  }

  // Create a webhook
  async createWebhook(data: {
    paylinkId: string
    targetUrl: string
    events: string[]
  }) {
    const payload = {
      paylinkId: data.paylinkId,
      targetUrl: data.targetUrl,
      events: data.events
    }

    return this.post(`/webhook/paylink?apiKey=${this.apiKey}`, payload, {
      Authorization: `Bearer ${this.apiSecret}`
    })
  }

  // Create subscription webhook
  async createSubscriptionWebhook(data: {
    paylinkId: string
    targetUrl: string
    events: ('STARTED' | 'RENEWED' | 'ENDED')[]
  }) {
    const payload = {
      paylinkId: data.paylinkId,
      targetUrl: data.targetUrl,
      events: data.events
    }

    return this.post(`/webhook/paylink/subscription?apiKey=${this.apiKey}`, payload, {
      Authorization: `Bearer ${this.apiSecret}`
    })
  }

  // Get payment details
  async getPayment(paymentId: string) {
    return this.get(`/payment/${paymentId}`, undefined, {
      Authorization: `Bearer ${this.apiSecret}`
    })
  }

  // Get transaction details
  async getTransaction(transactionId: string) {
    return this.get(`/transaction/${transactionId}`, undefined, {
      Authorization: `Bearer ${this.apiSecret}`
    })
  }
}

// Helio service class
export class HelioService {
  private client: HelioAPIClient

  constructor() {
    this.client = new HelioAPIClient()
  }

  // Create payment for a model purchase
  async createModelPayment(
    modelId: string,
    plan: PricingPlan,
    userEmail?: string,
    metadata?: Record<string, any>
  ) {
    try {
      // Convert plan price to appropriate units for Helio
      const amount = this.convertPriceToHelio(plan.price, plan.unit)
      const currency = 'USDC' // Default to USDC, can be configurable

      const payLinkResponse = await this.client.createPayLink({
        modelId,
        planId: plan.id,
        amount,
        currency,
        customerEmail: userEmail,
        metadata: {
          planName: plan.name,
          planType: plan.type,
          ...metadata
        }
      })

      if (!payLinkResponse.success || !payLinkResponse.data) {
        throw new APIError('Failed to create pay link', 400, payLinkResponse)
      }

      // Create webhook for this payment
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/helio`
      await this.client.createWebhook({
        paylinkId: payLinkResponse.data.id,
        targetUrl: webhookUrl,
        events: ['CREATED']
      })

      return payLinkResponse.data
    } catch (error) {
      console.error('Error creating Helio payment:', error)
      throw error
    }
  }

  // Create subscription payment
  async createModelSubscription(
    modelId: string,
    plan: PricingPlan,
    userEmail?: string,
    metadata?: Record<string, any>
  ) {
    try {
      const amount = this.convertPriceToHelio(plan.price, plan.unit)
      const currency = 'USDC'
      const interval = this.getIntervalFromUnit(plan.unit)

      const subscriptionResponse = await this.client.createSubscriptionPayLink({
        modelId,
        planId: plan.id,
        amount,
        currency,
        interval,
        customerEmail: userEmail,
        metadata: {
          planName: plan.name,
          planType: plan.type,
          ...metadata
        }
      })

      if (!subscriptionResponse.success || !subscriptionResponse.data) {
        throw new APIError('Failed to create subscription pay link', 400, subscriptionResponse)
      }

      // Create webhook for subscription events
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/helio/subscription`
      await this.client.createSubscriptionWebhook({
        paylinkId: subscriptionResponse.data.id,
        targetUrl: webhookUrl,
        events: ['STARTED', 'RENEWED', 'ENDED']
      })

      return subscriptionResponse.data
    } catch (error) {
      console.error('Error creating Helio subscription:', error)
      throw error
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string, sharedToken: string): boolean {
    // Implement webhook signature verification
    // This would typically use HMAC-SHA256 with the shared token
    try {
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', sharedToken)
        .update(payload)
        .digest('hex')
      
      return signature === expectedSignature
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  // Process webhook payload
  async processWebhook(payload: HelioWebhookPayload): Promise<HelioPayment> {
    const { event, transactionObject } = payload
    const { meta } = transactionObject

    // Extract model and user information from metadata
    const modelId = meta.customerDetails?.email || '' // This should be stored in metadata
    const userId = meta.customerDetails?.email || '' // This should come from user lookup

    // Create payment record
    const payment: HelioPayment = {
      id: `payment_${Date.now()}`, // Generate temporary ID
      modelId,
      userId,
      amount: parseFloat(meta.amount) / 1000000, // Convert from minimal units
      currency: 'USDC', // Extracted from meta if available
      transactionSignature: meta.transactionSignature,
      status: meta.transactionStatus === 'SUCCESS' ? 'completed' : 'failed',
      paylinkId: transactionObject.paylinkId,
      createdAt: new Date()
    }

    // Store payment in database (implement based on your data layer)
    // const savedPayment = await this.savePayment(payment)

    // Handle different event types
    switch (event) {
      case 'CREATED':
        await this.handlePaymentCreated(payment)
        break
      case 'STARTED':
        await this.handleSubscriptionStarted(payment)
        break
      case 'RENEWED':
        await this.handleSubscriptionRenewed(payment)
        break
      case 'ENDED':
        await this.handleSubscriptionEnded(payment)
        break
    }

    return payment
  }

  // Handle one-time payment completion
  private async handlePaymentCreated(payment: HelioPayment) {
    console.log('Processing one-time payment:', payment)
    
    // Grant access to the model
    // Update user subscriptions
    // Send confirmation email
    // Update creator earnings
  }

  // Handle subscription start
  private async handleSubscriptionStarted(payment: HelioPayment) {
    console.log('Processing subscription start:', payment)
    
    // Create subscription record
    // Grant access to the model
    // Send welcome email
    // Update creator earnings
  }

  // Handle subscription renewal
  private async handleSubscriptionRenewed(payment: HelioPayment) {
    console.log('Processing subscription renewal:', payment)
    
    // Extend subscription period
    // Update creator earnings
    // Send renewal confirmation
  }

  // Handle subscription end
  private async handleSubscriptionEnded(payment: HelioPayment) {
    console.log('Processing subscription end:', payment)
    
    // Revoke access to the model
    // Send cancellation email
    // Update subscription status
  }

  // Convert pricing to Helio-compatible format
  private convertPriceToHelio(price: number, unit: string): number {
    // Convert different pricing units to USDC amount
    switch (unit) {
      case '1k tokens':
        return price * 1000 // Assuming price is per 1k tokens
      case '1M tokens':
        return price * 1000000
      case 'month':
        return price
      case 'request':
        return price
      default:
        return price
    }
  }

  // Get subscription interval from pricing unit
  private getIntervalFromUnit(unit: string): 'daily' | 'weekly' | 'monthly' | 'yearly' {
    if (unit.includes('day')) return 'daily'
    if (unit.includes('week')) return 'weekly'
    if (unit.includes('month')) return 'monthly'
    if (unit.includes('year')) return 'yearly'
    return 'monthly' // Default
  }

  // Get payment status
  async getPaymentStatus(paymentId: string) {
    try {
      const response = await this.client.getPayment(paymentId)
      return response.data
    } catch (error) {
      console.error('Error fetching payment status:', error)
      throw error
    }
  }

  // Get transaction details
  async getTransactionDetails(transactionId: string) {
    try {
      const response = await this.client.getTransaction(transactionId)
      return response.data
    } catch (error) {
      console.error('Error fetching transaction details:', error)
      throw error
    }
  }
}

// Export singleton instance
export const helioService = new HelioService()

// Export singleton instance
export const helioApiClient = new HelioAPIClient()

// Also export the class for advanced usage
export { HelioAPIClient }

// Utility functions for Helio integration
export const formatCryptoAmount = (amount: number, currency: string): string => {
  const decimals = currency === 'SOL' ? 9 : 6 // SOL has 9 decimals, USDC has 6
  return (amount / Math.pow(10, decimals)).toFixed(decimals)
}

export const parseCryptoAmount = (amount: string, currency: string): number => {
  const decimals = currency === 'SOL' ? 9 : 6
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals))
}

export const generateMetadata = (
  modelId: string,
  planId: string,
  userId?: string,
  additional?: Record<string, any>
) => {
  return {
    modelId,
    planId,
    userId,
    timestamp: Date.now(),
    version: '1.0',
    ...additional
  }
} 