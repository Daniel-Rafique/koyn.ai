import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/database"
import bcrypt from "bcryptjs"

// Build providers array conditionally based on available environment variables
const providers = []

// Add OAuth providers only if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(GitHubProvider({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }))
}

// Always include credentials provider
providers.push(CredentialsProvider({
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
      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email
        }
      })

      if (!user) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password || ""
      )

      if (!isPasswordValid) {
        return null
      }

      // Return user object compatible with NextAuth expectations
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar || undefined,
      }
    } catch (error) {
      console.error("Error during credentials authorization:", error)
      return null
    }
  }
}))

const handler = NextAuth({
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        
        try {
          // Fetch additional user data for JWT
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
          })
          
          if (dbUser) {
            token.userType = dbUser.type
            token.name = dbUser.name
          }
        } catch (error) {
          console.error("Error fetching user data for JWT:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.userType = token.userType as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user for OAuth providers
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.email!.split('@')[0] + Math.random().toString(36).substr(2, 4),
                avatar: user.image,
                type: "CONSUMER",
                emailVerified: new Date(),
              }
            })
          }
        } catch (error) {
          console.error("Error creating user:", error)
          return false
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
})

export { handler as GET, handler as POST } 