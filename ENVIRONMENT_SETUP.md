# Environment Variables Setup Guide

## Required Environment Variables

### Database
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/koynai"
```

### NextAuth.js
```bash
NEXTAUTH_URL="http://localhost:3000"  # Your app URL
NEXTAUTH_SECRET="your-super-secret-jwt-key-here"  # Generate with: openssl rand -base64 32
```

### OAuth Providers
```bash
# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth  
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### AI Model API Keys
```bash
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
HUGGINGFACE_API_KEY="hf_your-huggingface-api-key"
REPLICATE_API_TOKEN="r8_your-replicate-api-token"
```

### 🪙 Helio Crypto Payments (IMPORTANT)
```bash
# Get these from https://app.hel.io (production) or https://app.dev.hel.io (development)
HELIO_API_KEY="your-helio-public-api-key"          # Public API key
HELIO_API_SECRET="your-helio-api-secret"           # Secret API token
HELIO_WEBHOOK_SECRET="your-helio-webhook-shared-secret"  # Generated when creating webhooks
```

### Application URLs
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Change for production
```

### Feature Flags
```bash
NEXT_PUBLIC_ENABLE_CRYPTO_PAYMENTS="true"
NEXT_PUBLIC_ENABLE_FINE_TUNING="false"
NEXT_PUBLIC_ENABLE_SOCIAL_FEATURES="true"
NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS="false"
NEXT_PUBLIC_ENABLE_API_PLAYGROUND="true"
NEXT_PUBLIC_ENABLE_COMMUNITY_FEATURES="true"
```

## 🚀 Helio Setup Instructions

### 1. Create Helio Account
- **Development:** Visit https://app.dev.hel.io
- **Production:** Visit https://app.hel.io

### 2. Generate API Keys
1. Log in to your Helio dashboard
2. Navigate to API Keys section
3. Generate both public API key (`HELIO_API_KEY`) and secret token (`HELIO_API_SECRET`)

### 3. Test on Devnet First
- Always test your integration on Helio's development environment
- Use devnet currencies for testing
- Verify webhooks work correctly

### 4. Webhook Setup
- Webhooks are automatically created when payments are initiated
- The `HELIO_WEBHOOK_SECRET` is the `sharedToken` returned when creating webhooks
- Webhook URLs:
  - **Pay Links:** `{YOUR_DOMAIN}/api/webhooks/helio`
  - **Subscriptions:** `{YOUR_DOMAIN}/api/webhooks/helio/subscription`

## 🔧 Environment File Creation

Create a `.env.local` file in your project root with the variables above:

```bash
# Copy this template and fill in your actual values
cp ENVIRONMENT_SETUP.md .env.local
# Then edit .env.local with your actual values
```

## ⚠️ Security Notes

- **Never commit** `.env.local` or `.env` files to version control
- Keep your `HELIO_API_SECRET` secure - it has full access to your account
- Use different credentials for development and production
- Rotate API keys regularly for security

## 🧪 Testing Your Setup

1. Start your development server: `npm run dev`
2. Check the console for Helio configuration warnings
3. Test a payment flow using devnet currencies
4. Verify webhooks are received and processed correctly

## 📝 Production Checklist

- [ ] Helio production API keys configured
- [ ] Webhook endpoints are publicly accessible
- [ ] SSL certificates are valid for webhook URLs
- [ ] Database connection is secure and pooled
- [ ] All environment variables are set in production environment
- [ ] Feature flags are configured appropriately 