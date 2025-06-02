import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      type?: string
      verified?: boolean
    }
  }

  interface User {
    id: string
    type?: string
    verified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    type?: string
    verified?: boolean
  }
} 