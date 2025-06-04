/**
 * Environment Variables Validation for Production
 */

export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ]

  const optionalEnvVars = [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'HUGGINGFACE_API_KEY',
    'REPLICATE_API_TOKEN',
    'HELIO_API_KEY',
    'HELIO_API_SECRET',
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your Vercel dashboard or .env file.`
    )
  }

  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar])
  
  if (missingOptional.length > 0) {
    console.warn(
      `⚠️  Missing optional environment variables: ${missingOptional.join(', ')}\n` +
      `Some features may not work properly.`
    )
  }

  console.log('✅ Environment validation passed!')
  
  return {
    isProduction: process.env.NODE_ENV === 'production',
    hasDatabase: !!process.env.DATABASE_URL,
    hasAuth: !!(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET),
    hasOAuth: !!(process.env.GITHUB_CLIENT_ID && process.env.GOOGLE_CLIENT_ID),
    hasAI: !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
    hasPayments: !!(process.env.HELIO_API_KEY || process.env.STRIPE_SECRET_KEY),
  }
}

// Validate on import in production
if (process.env.NODE_ENV === 'production') {
  validateEnvironment()
} 