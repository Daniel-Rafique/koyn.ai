import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import { prisma } from "./database"

// Build providers array
const providers = []

// Conditionally add OAuth providers based on environment variables
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  )
  console.log("Auth: Added Google provider")
} else {
  console.log("Auth: Google provider not configured")
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    })
  )
  console.log("Auth: Added GitHub provider")
} else {
  console.log("Auth: GitHub provider not configured")
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
      console.log("SignIn Callback - Provider:", account?.provider)
      console.log("SignIn Callback - User:", JSON.stringify({email: user.email, name: user.name}))
      
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          
          console.log("SignIn Callback - Existing user:", existingUser ? "Found" : "Not found")

          if (!existingUser) {
            // Create new user from OAuth
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                avatar: user.image,
                type: "CONSUMER",
                emailVerified: new Date(), // Auto-verify OAuth users
              }
            })
            console.log("SignIn Callback - Created new user")
          }
          return true
        } catch (error) {
          console.error("Sign in error:", error)
          return false
        }
      }
      return true
    },

    async redirect({ url, baseUrl }) {
      console.log("Redirect Callback - URL:", url)
      console.log("Redirect Callback - Base URL:", baseUrl)
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
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