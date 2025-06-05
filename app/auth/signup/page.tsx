"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Github, Chrome, Loader2, AlertCircle, User, Briefcase } from "lucide-react"
import { UserRole } from "@/lib/types"

export default function SignUpPage() {
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    role: UserRole.CONSUMER,
    agreeToTerms: false,
    subscribeNewsletter: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.email) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!formData.username) {
      errors.username = "Username is required"
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters"
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, hyphens, and underscores"
    }

    if (!formData.displayName) {
      errors.displayName = "Display name is required"
    }

    if (!formData.password) {
      errors.password = "Password is required"
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the terms and conditions"
    }

    return Object.keys(errors).length === 0
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormErrors({})

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      console.log("Submitting signup form", { email: formData.email });
      
      // Register the user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          displayName: formData.displayName || formData.username,
          password: formData.password,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Registration error:", data);
        setFormErrors({
          general: data.error || "Failed to create account",
        })
        setIsLoading(false)
        return
      }

      console.log("Registration successful, attempting sign-in");
      // Sign in the user after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Post-registration sign-in failed:", result.error);
        setFormErrors({ general: "Account created but sign-in failed. Please try signing in manually." })
      } else {
        console.log("Sign-in successful, redirecting to home");
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setFormErrors({ general: "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    if (provider === "google") setIsGoogleLoading(true)
    if (provider === "github") setIsGithubLoading(true)

    // Set a sensible callbackUrl that works in both environments
    const effectiveCallbackUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://koyn.ai';

    console.log(`Signing up with ${provider}, callback: ${effectiveCallbackUrl}`);

    try {
      await signIn(provider, { 
        callbackUrl: effectiveCallbackUrl,
        redirect: true
      })
    } catch (error) {
      console.error(`Error signing up with ${provider}:`, error)
      setFormErrors({ general: `Authentication with ${provider} failed. Please try again.` })
    } finally {
      setIsGoogleLoading(false)
      setIsGithubLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Join the AI model marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formErrors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {formErrors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* OAuth Providers */}
          <div className="space-y-2">
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
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create account with email
              </span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Account Type Selection */}
            <div className="space-y-3">
              <Label>I want to</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                  <RadioGroupItem value={UserRole.CONSUMER} id="consumer" />
                  <div className="flex-1">
                    <Label htmlFor="consumer" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span className="font-medium">Use Models</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">Access AI models</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                  <RadioGroupItem value={UserRole.CREATOR} id="creator" />
                  <div className="flex-1">
                    <Label htmlFor="creator" className="flex items-center cursor-pointer">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span className="font-medium">Sell Models</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">Monetize your AI</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={formErrors.username ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {formErrors.username && (
                  <p className="text-xs text-red-600">{formErrors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={formErrors.displayName ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {formErrors.displayName && (
                  <p className="text-xs text-red-600">{formErrors.displayName}</p>
                )}
              </div>
            </div>

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
                <p className="text-xs text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={formErrors.password ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {formErrors.password && (
                <p className="text-xs text-red-600">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={formErrors.confirmPassword ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {formErrors.confirmPassword && (
                <p className="text-xs text-red-600">{formErrors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked: boolean) => 
                    setFormData({ ...formData, agreeToTerms: checked })
                  }
                />
                <Label htmlFor="agreeToTerms" className="text-sm cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {formErrors.agreeToTerms && (
                <p className="text-xs text-red-600">{formErrors.agreeToTerms}</p>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="subscribeNewsletter"
                  checked={formData.subscribeNewsletter}
                  onCheckedChange={(checked: boolean) => 
                    setFormData({ ...formData, subscribeNewsletter: checked })
                  }
                />
                <Label htmlFor="subscribeNewsletter" className="text-sm cursor-pointer">
                  Subscribe to updates and new model notifications
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
