import "next-auth"
import "next-auth/jwt"
import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      userType: string
      type: string
      verified: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    type: string
    verified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    userType: string
    type: string
    verified: boolean
  }
} 