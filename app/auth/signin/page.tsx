"use client"

import { useState, useEffect } from "react"
import { signIn, getSession, getProviders } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Github, Mail, Chrome, Loader2, AlertCircle } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")
  
  const [providers, setProviders] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch available providers on component mount
  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormErrors({})

    // Basic validation
    const errors: Record<string, string> = {}
    if (!formData.email) errors.email = "Email is required"
    if (!formData.password) errors.password = "Password is required"
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setFormErrors({ general: "Invalid email or password" })
      } else {
        // Refresh session and redirect
        await getSession()
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setFormErrors({ general: "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    if (provider === "google") setIsGoogleLoading(true)
    if (provider === "github") setIsGithubLoading(true)

    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    } finally {
      setIsGoogleLoading(false)
      setIsGithubLoading(false)
    }
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password"
      case "OAuthAccountNotLinked":
        return "Account already exists with different provider"
      case "EmailCreateAccount":
        return "Could not create account"
      case "Callback":
        return "Authentication callback error"
      case "OAuthSignin":
        return "OAuth provider not configured. Please use email sign in or contact support."
      default:
        return "An error occurred during sign in"
    }
  }

  // Check if OAuth providers are available
  const hasGoogleProvider = providers?.google
  const hasGithubProvider = providers?.github
  const hasOAuthProviders = hasGoogleProvider || hasGithubProvider

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>
          )}

          {formErrors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {formErrors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* OAuth Providers - Only show if configured */}
          {hasOAuthProviders && (
            <>
              <div className="space-y-2">
                {hasGoogleProvider && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn("google")}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>
                )}

                {hasGithubProvider && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn("github")}
                    disabled={isGithubLoading}
                  >
                    {isGithubLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Github className="mr-2 h-4 w-4" />
                    )}
                    Continue with GitHub
                  </Button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Show info message if no OAuth providers are configured */}
          {!hasOAuthProviders && providers && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                OAuth providers are not configured yet. You can sign in with email and password.
              </AlertDescription>
            </Alert>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={formErrors.password ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {formErrors.password && (
                <p className="text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Email
                </>
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot your password?
            </Link>
            
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
