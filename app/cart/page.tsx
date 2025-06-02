"use client"

import { useState } from "react"
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function CartPage() {
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "LLaMA 2 70B Chat",
      creator: "Meta AI",
      category: "Natural Language Processing",
      pricing: { type: "premium", price: 0.02, unit: "1k tokens" },
      estimatedUsage: 50000, // tokens per month
      monthlyEstimate: 1.0,
    },
    {
      id: "2",
      name: "CLIP Vision Encoder",
      creator: "OpenAI",
      category: "Computer Vision",
      pricing: { type: "premium", price: 0.001, unit: "image" },
      estimatedUsage: 1000, // images per month
      monthlyEstimate: 1.0,
    },
    {
      id: "3",
      name: "Whisper Large V3",
      creator: "OpenAI",
      category: "Audio Processing",
      pricing: { type: "freemium", price: 0.006, unit: "minute" },
      estimatedUsage: 500, // minutes per month
      monthlyEstimate: 3.0,
    },
  ])

  const [promoCode, setPromoCode] = useState("")

  const updateUsage = (id: string, newUsage: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              estimatedUsage: Math.max(0, newUsage),
              monthlyEstimate: Math.max(0, newUsage) * item.pricing.price || 0,
            }
          : item,
      ),
    )
  }

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.monthlyEstimate, 0)
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + tax

  if (cartItems.length === 0) {
    return (
      <div className="container py-16">
        <div className="text-center space-y-6">
          <ShoppingCart className="h-24 w-24 text-muted-foreground mx-auto" />
          <h1 className="text-3xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover amazing AI models and add them to your cart to get started.
          </p>
          <Button asChild>
            <Link href="/models">Browse Models</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">Review your selected models and estimated usage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    <p className="text-muted-foreground mb-2">by {item.creator}</p>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pricing:</span>
                    <span className="text-sm">
                      ${item.pricing.price}/{item.pricing.unit}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`usage-${item.id}`} className="text-sm font-medium">
                      Estimated monthly usage:
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateUsage(item.id, item.estimatedUsage - 1000)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id={`usage-${item.id}`}
                        type="number"
                        value={item.estimatedUsage}
                        onChange={(e) => updateUsage(item.id, Number.parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <span className="text-sm text-muted-foreground min-w-fit">{item.pricing.unit}s</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateUsage(item.id, item.estimatedUsage + 1000)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-medium">Monthly estimate:</span>
                    <span className="font-semibold">${item.monthlyEstimate.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{item.name}</span>
                    <span>${item.monthlyEstimate.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}/month</span>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <Label htmlFor="promo">Promo Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="promo"
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button variant="outline">Apply</Button>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button className="w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/models">
                    Continue Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                <p>• Billing is monthly based on actual usage</p>
                <p>• You can cancel or modify anytime</p>
                <p>• Free tier limits apply to each model</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
