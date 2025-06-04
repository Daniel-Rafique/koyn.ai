"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type VerificationState = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setState('success')
        setMessage(data.message)
        setEmail(data.email)
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?message=email-verified')
        }, 3000)
      } else {
        setState('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      setState('error')
      setMessage('Failed to verify email. Please try again.')
    }
  }

  const resendVerification = async () => {
    if (!email) return

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage('Verification email sent successfully')
      } else {
        setMessage(data.error || 'Failed to resend verification')
      }
    } catch (error) {
      setMessage('Failed to resend verification email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            {state === 'loading' && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
            {state === 'success' && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {state === 'error' && (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          
          <CardTitle>
            {state === 'loading' && 'Verifying Email...'}
            {state === 'success' && 'Email Verified!'}
            {state === 'error' && 'Verification Failed'}
          </CardTitle>
          
          <CardDescription>
            {state === 'loading' && 'Please wait while we verify your email address.'}
            {state === 'success' && 'Your email has been successfully verified.'}
            {state === 'error' && 'There was a problem verifying your email.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant={state === 'success' ? 'default' : 'destructive'}>
            <Mail className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          {state === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to sign in page in a few seconds...
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  Continue to Sign In
                </Link>
              </Button>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">
                  Create New Account
                </Link>
              </Button>
              
              {email && (
                <Button 
                  onClick={resendVerification}
                  variant="secondary" 
                  className="w-full"
                >
                  Resend Verification Email
                </Button>
              )}
              
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          )}

          {state === 'loading' && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 