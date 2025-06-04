# Authentication Setup Guide

## Current Status ✅
- NextAuth.js is configured with conditional OAuth providers
- Password authentication is working
- JWT secret is generated
- Authentication error handling is implemented
- `.env.local` file is created (empty)

## Next Steps - OAuth Provider Setup

### 1. GitHub OAuth App Setup

1. Go to https://github.com/settings/applications/new
2. Fill in these details:
   - **Application name**: `Koyn.ai AI Model Marketplace`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. After creating the app, copy the:
   - **Client ID**
   - **Client Secret**

### 2. Google OAuth Credentials Setup

1. Go to https://console.developers.google.com/
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen first if prompted
6. For the OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Name**: `Koyn.ai AI Model Marketplace`
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
7. Copy the:
   - **Client ID**
   - **Client Secret**

### 3. Update .env.local File

Add these credentials to your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=nRIP68HFzqqOt9JRaZ4uiVvlz0gCsBdAfyCpB8J5JHM=

# GitHub OAuth (replace with your actual credentials)
GITHUB_ID=your_github_client_id_here
GITHUB_SECRET=your_github_client_secret_here

# Google OAuth (replace with your actual credentials)  
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database URL (update as needed)
DATABASE_URL="postgresql://username:password@localhost:5432/koyn_ai"
```

### 4. Test the Setup

1. Restart your development server: `npm run dev`
2. Go to http://localhost:3000/auth/signin
3. You should now see OAuth buttons for GitHub and Google (if configured)
4. The sign-in page will gracefully handle missing providers

### 5. For Production

When deploying to production, update the callback URLs:
- GitHub: `https://yourdomain.com/api/auth/callback/github`
- Google: `https://yourdomain.com/api/auth/callback/google`
- Update `NEXTAUTH_URL=https://yourdomain.com` in production env

## Benefits of This Setup

- ✅ OAuth providers load conditionally (no more `client_id` errors)
- ✅ Graceful fallback to email/password when OAuth is not configured
- ✅ Clear error messages for users
- ✅ Secure JWT token handling
- ✅ Production-ready authentication flow

## What's Working Now

Even without OAuth setup, users can:
- ✅ Sign up with email/password
- ✅ Sign in with email/password  
- ✅ View authenticated pages
- ✅ See helpful messages about OAuth setup status 