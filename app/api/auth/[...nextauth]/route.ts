import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Add debugging helper
const debugAuth = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[NEXTAUTH DEBUG] ${message}`, data ? data : '')
  }
}

debugAuth("NextAuth route handler initializing", {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  nodeEnv: process.env.NODE_ENV,
  hasGithubConfig: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  hasGoogleConfig: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
})

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 