import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import { prisma } from "./database"

// Near the top of the file, add debugging helper:
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH DEBUG] ${message}`, data ? data : '')
  }
}

// Build providers array
const providers = []

// Conditionally add OAuth providers based on environment variables
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  debugLog(`Adding Google provider with clientId: ${process.env.GOOGLE_CLIENT_ID.substring(0, 5)}...`)
  
  const callbackUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/auth/callback/google' 
    : 'https://koyn.ai/api/auth/callback/google';
    
  debugLog(`Google callback URL: ${callbackUrl}`);
  
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          redirect_uri: callbackUrl
        }
      }
    })
  )
  console.log("Auth: Added Google provider")
} else {
  console.log("Auth: Google provider not configured", 
    process.env.GOOGLE_CLIENT_ID ? "Has client ID" : "Missing client ID", 
    process.env.GOOGLE_CLIENT_SECRET ? "Has client secret" : "Missing client secret")
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  debugLog(`Adding GitHub provider with clientId: ${process.env.GITHUB_CLIENT_ID.substring(0, 5)}...`)
  
  const callbackUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/auth/callback/github' 
    : 'https://koyn.ai/api/auth/callback/github';
    
  debugLog(`GitHub callback URL: ${callbackUrl}`);
  
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          redirect_uri: callbackUrl
        }
      }
    })
  )
  console.log("Auth: Added GitHub provider")
} else {
  console.log("Auth: GitHub provider not configured", 
    process.env.GITHUB_CLIENT_ID ? "Has client ID" : "Missing client ID", 
    process.env.GITHUB_CLIENT_SECRET ? "Has client secret" : "Missing client secret")
}

// Always add credentials provider
providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { creatorProfile: true }
        })

        if (!user || !user.password) {
          return null
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar || undefined,
          type: user.type,
          verified: user.creatorProfile?.verified || false
        }
      } catch (error) {
        console.error("Auth error:", error)
        return null
      }
    }
  })
)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("JWT Callback - User:", user ? JSON.stringify({id: user.id, email: user.email}) : "No user")
      console.log("JWT Callback - Token:", JSON.stringify(token))
      
      // Initial sign in
      if (user) {
        token.id = user.id
        token.type = user.type
        token.verified = user.verified
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token = { ...token, ...session.user }
      }

      return token
    },

    async session({ session, token }) {
      console.log("Session Callback - Token:", JSON.stringify(token))
      
      if (token) {
        session.user.id = token.id as string
        session.user.type = token.type as string
        session.user.verified = token.verified as boolean
      }
      return session
    },

    async signIn({ user, account, profile }) {
      debugLog("SignIn callback triggered", { provider: account?.provider, email: user.email })
      
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          
          debugLog("SignIn Callback - Existing user found:", existingUser ? "true" : "false")

          if (!existingUser) {
            // Create new user from OAuth
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || user.email!.split('@')[0],
                avatar: user.image,
                type: "CONSUMER",
                emailVerified: new Date(), // Auto-verify OAuth users
              }
            })
            debugLog("Created new OAuth user", { id: newUser.id, email: newUser.email })
          }
          return true
        } catch (error) {
          console.error("Sign in error:", error)
          debugLog("OAuth Sign-in error", { message: (error as Error).message })
          return false
        }
      }
      return true
    },

    async redirect({ url, baseUrl }) {
      debugLog("Redirect Callback - Original URL:", url)
      debugLog("Redirect Callback - Base URL:", baseUrl)
      
      // Handle production vs development URLs
      const productionUrl = "https://koyn.ai";
      const developmentUrl = "http://localhost:3000";
      
      // If we're in a production environment but get localhost URLs, fix them
      if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
        url = url.replace(developmentUrl, productionUrl);
        debugLog("Redirect fixed for production:", url);
      }
      
      // If we're in development but get production URLs, fix them
      if (process.env.NODE_ENV === 'development' && url.includes('koyn.ai')) {
        url = url.replace(productionUrl, developmentUrl);
        debugLog("Redirect fixed for development:", url);
      }
      
      // Standard NextAuth redirect logic
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}${url}`;
        debugLog("Final redirect URL (relative):", finalUrl);
        return finalUrl;
      }
      else if (new URL(url).origin === baseUrl) {
        debugLog("Final redirect URL (same origin):", url);
        return url;
      }
      
      debugLog("Final redirect URL (default):", baseUrl);
      return baseUrl;
    }
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider || 'credentials'}, isNewUser: ${isNewUser}`)
    },
    async signOut({ session }) {
      console.log(`User ${session?.user?.email} signed out`)
    }
  },

  debug: true // Enable debug mode
} 