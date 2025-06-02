"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, CreditCard, Coins, Loader2, Check, Zap, Calendar, CalendarDays, CalendarRange } from "lucide-react"
import { Model, PricingPlan } from "@/lib/types"

interface SubscriptionModalProps {
  model: Model
  plan: PricingPlan
  children: React.ReactNode
}

interface DurationOption {
  value: string
  label: string
  icon: React.ReactNode
  multiplier: number
  popular?: boolean
}

const durationOptions: DurationOption[] = [
  {
    value: "hourly",
    label: "1 Hour",
    icon: <Clock className="h-4 w-4" />,
    multiplier: 0.05
  },
  {
    value: "daily",
    label: "1 Day",
    icon: <Calendar className="h-4 w-4" />,
    multiplier: 0.1,
    popular: true
  },
  {
    value: "weekly",
    label: "1 Week",
    icon: <CalendarDays className="h-4 w-4" />,
    multiplier: 0.3
  },
  {
    value: "monthly",
    label: "1 Month",
    icon: <CalendarRange className="h-4 w-4" />,
    multiplier: 1.0
  }
]

export function SubscriptionModal({ model, plan, children }: SubscriptionModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [duration, setDuration] = useState("daily")
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "helio">("helio")
  const [currency, setCurrency] = useState<"SOL" | "ETH" | "USDC">("USDC")

  const selectedDuration = durationOptions.find(d => d.value === duration)
  const finalPrice = plan.price * (selectedDuration?.multiplier || 1)

  const handlePurchase = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/models/${model.id}`)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/models/${model.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          duration,
          paymentMethod,
          currency: paymentMethod === "helio" ? currency : undefined,
          successUrl: `${window.location.origin}/models/${model.id}?success=true`,
          cancelUrl: `${window.location.origin}/models/${model.id}?canceled=true`
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create payment")
        return
      }

      if (result.paymentUrl) {
        // Redirect to payment page
        window.location.href = result.paymentUrl
      } else {
        setError("Payment URL not received")
      }

    } catch (error) {
      console.error("Purchase error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {model.name}</DialogTitle>
          <DialogDescription>
            Choose your subscription duration and payment method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Duration Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Subscription Duration</Label>
            <RadioGroup value={duration} onValueChange={setDuration}>
              {durationOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex items-center justify-between w-full cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span>{option.label}</span>
                      {option.popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">
                      ${(plan.price * option.multiplier).toFixed(2)}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="helio" id="helio" />
                <Label htmlFor="helio" className="flex items-center space-x-2 cursor-pointer">
                  <Coins className="h-4 w-4" />
                  <span>Crypto (Helio)</span>
                  <Badge variant="outline" className="text-xs">
                    -5% fees
                  </Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  <span>Credit Card (Coming Soon)</span>
                </Label>
              </div>
            </RadioGroup>

            {/* Crypto Currency Selection */}
            {paymentMethod === "helio" && (
              <div className="ml-6 space-y-2">
                <Label className="text-sm">Currency</Label>
                <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Model Access</span>
                <span>{selectedDuration?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Plan</span>
                <span>{plan.name}</span>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>${finalPrice.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={isLoading || (paymentMethod === "stripe")}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Payment...
              </>
            ) : paymentMethod === "stripe" ? (
              "Coming Soon"
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Pay with {paymentMethod === "helio" ? "Crypto" : "Card"}
              </>
            )}
          </Button>

          {paymentMethod === "helio" && (
            <p className="text-xs text-muted-foreground text-center">
              You'll be redirected to Helio to complete your crypto payment securely
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 