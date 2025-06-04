import { helioService } from './helio'
import { HELIO_CONFIG } from './constants'

export class HelioTestService {
  
  // Test Helio API credentials
  async testCredentials(): Promise<{
    valid: boolean
    environment: 'production' | 'development'
    errors: string[]
  }> {
    const errors: string[] = []
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    
    // Check environment variables
    if (!process.env.HELIO_API_KEY) {
      errors.push('HELIO_API_KEY is not set')
    }
    
    if (!process.env.HELIO_API_SECRET) {
      errors.push('HELIO_API_SECRET is not set')
    }
    
    if (!process.env.HELIO_WEBHOOK_SECRET) {
      errors.push('HELIO_WEBHOOK_SECRET is not set (will be generated when creating webhooks)')
    }
    
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      errors.push('NEXT_PUBLIC_APP_URL is not set (needed for webhook URLs)')
    }
    
    return {
      valid: errors.length === 0,
      environment,
      errors
    }
  }

  // Create a test payment link
  async createTestPayment(): Promise<{
    success: boolean
    paymentUrl?: string
    error?: string
  }> {
    try {
      const testPlan = {
        id: 'test_plan_001',
        modelId: 'test_model_001',
        name: 'Test Plan',
        description: 'Test plan for Helio integration',
        unit: 'monthly' as any,
        pricePerUnit: 9.99,
        currency: 'USD',
        monthlyLimit: 1000,
        features: ['API Access', 'Basic Support'],
        isPopular: false
      }

      const paymentLink = await helioService.createModelPayment(
        'test_model_001',
        testPlan,
        'test_user_123',
        'test@example.com',
        {
          testMode: true,
          description: 'Test payment for Helio integration'
        }
      )

      return {
        success: true,
        paymentUrl: paymentLink.url
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Create a test subscription
  async createTestSubscription(): Promise<{
    success: boolean
    subscriptionUrl?: string
    error?: string
  }> {
    try {
      const testPlan = {
        id: 'test_subscription_001',
        modelId: 'test_model_001',
        name: 'Test Monthly Subscription',
        description: 'Test monthly subscription for Helio integration',
        unit: 'monthly' as any,
        pricePerUnit: 19.99,
        currency: 'USD',
        monthlyLimit: 10000,
        features: ['API Access', 'Priority Support', 'Advanced Features'],
        isPopular: true
      }

      const subscriptionLink = await helioService.createModelSubscription(
        'test_model_001',
        testPlan,
        'test_user_123',
        'test@example.com',
        {
          testMode: true,
          description: 'Test subscription for Helio integration'
        }
      )

      return {
        success: true,
        subscriptionUrl: subscriptionLink.url
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Test webhook signature verification
  testWebhookSignature(): {
    valid: boolean
    error?: string
  } {
    try {
      const testPayload = JSON.stringify({
        event: 'CREATED',
        transactionObject: {
          id: 'test_transaction_123',
          paylinkId: 'test_paylink_123',
          meta: {
            transactionStatus: 'SUCCESS',
            amount: '1000000',
            transactionSignature: 'test_signature_123'
          }
        }
      })

      const testSharedToken = 'test_shared_token_123'
      const testSignature = `Bearer ${testSharedToken}`

      const isValid = helioService.verifyWebhookSignature(testPayload, testSignature, testSharedToken)

      return {
        valid: isValid
      }

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Generate a sample webhook payload for testing
  generateSampleWebhook(event: 'CREATED' | 'STARTED' | 'RENEWED' | 'ENDED' = 'CREATED') {
    return {
      event,
      transactionObject: {
        id: `test_transaction_${Date.now()}`,
        paylinkId: `test_paylink_${Date.now()}`,
        quantity: 1,
        fee: '20000', // 0.02 USDC
        createdAt: new Date().toISOString(),
        paymentType: 'PAYLINK',
        meta: {
          id: `test_meta_${Date.now()}`,
          amount: '1000000', // 1 USDC
          senderPK: '7YancRyNQyp9s6G7YNwx9H93UqswoKWqF9GuNJPufyvW',
          recipientPK: '8YbncRzNQyp9s6G7YNwx9H93UqswoKWqF9GuNJPufyvX',
          transactionType: 'PAYLINK',
          transactionSignature: `test_signature_${Date.now()}`,
          transactionStatus: 'SUCCESS' as const,
          customerDetails: {
            email: 'test@example.com'
          },
          productDetails: null,
          totalAmount: '1000000',
          currency: {
            id: 'usdc_test_id',
            blockchain: null
          }
        }
      }
    }
  }

  // Get configuration summary
  getConfigSummary() {
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      apiBaseUrl: process.env.NODE_ENV === 'production' 
        ? HELIO_CONFIG.PRODUCTION_API 
        : HELIO_CONFIG.DEVELOPMENT_API,
      webhookEndpoints: {
        payLink: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/helio`,
        subscription: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/helio/subscription`
      },
      supportedCurrencies: HELIO_CONFIG.SUPPORTED_CURRENCIES,
      defaultCurrency: HELIO_CONFIG.DEFAULT_CURRENCY,
      featureFlags: {
        cryptoPayments: process.env.NEXT_PUBLIC_ENABLE_CRYPTO_PAYMENTS === 'true'
      }
    }
  }

  // Log detailed configuration for debugging
  logConfiguration() {
    const config = this.getConfigSummary()
    
    console.log('🪙 Helio Configuration Summary:')
    console.log('  Environment:', config.environment)
    console.log('  API Base URL:', config.apiBaseUrl)
    console.log('  Webhook Endpoints:')
    console.log('    Pay Link:', config.webhookEndpoints.payLink)
    console.log('    Subscription:', config.webhookEndpoints.subscription)
    console.log('  Supported Currencies:', config.supportedCurrencies.join(', '))
    console.log('  Default Currency:', config.defaultCurrency)
    console.log('  Crypto Payments Enabled:', config.featureFlags.cryptoPayments)
    
    // Check credentials (without logging sensitive data)
    console.log('  Credentials:')
    console.log('    API Key:', process.env.HELIO_API_KEY ? '✅ Set' : '❌ Missing')
    console.log('    API Secret:', process.env.HELIO_API_SECRET ? '✅ Set' : '❌ Missing')
    console.log('    Webhook Secret:', process.env.HELIO_WEBHOOK_SECRET ? '✅ Set' : '⚠️ Not set (will be generated)')
  }
}

// Export singleton instance
export const helioTestService = new HelioTestService() 