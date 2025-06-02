"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Clock, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react"

interface Subscription {
  id: string
  model: {
    id: string
    name: string
    creator: {
      displayName: string
    }
  }
  plan: {
    name: string
    price: number
    unit: string
  }
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  helioTransactionId?: string
}

export function SubscriptionsDashboard() {
  const { data: session } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptions()
    }
  }, [session])

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/subscriptions")
      const data = await response.json()

      if (data.success) {
        setSubscriptions(data.subscriptions)
      } else {
        setError(data.error || "Failed to fetch subscriptions")
      }
    } catch (error) {
      setError("An error occurred while fetching subscriptions")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-500"
      case "expired": return "bg-red-500"
      case "cancelled": return "bg-gray-500"
      default: return "bg-yellow-500"
    }
  }

  const getTimeRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} left`
    return "Less than 1 hour left"
  }

  const getTimeProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()
    
    if (now >= end) return 100
    if (now <= start) return 0
    
    return ((now - start) / (end - start)) * 100
  }

  if (!session) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to view your subscriptions.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Subscriptions</h2>
          <p className="text-muted-foreground">
            Manage your AI model subscriptions and usage
          </p>
        </div>
        <Button onClick={fetchSubscriptions} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : subscriptions.filter(sub => sub.status === "ACTIVE").length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active model subscriptions yet.
                </p>
                <Button onClick={() => window.location.href = "/models"}>
                  Browse Models
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subscriptions
                .filter(sub => sub.status === "ACTIVE")
                .map((subscription) => {
                  const timeRemaining = getTimeRemaining(subscription.currentPeriodEnd)
                  const progress = getTimeProgress(
                    subscription.currentPeriodStart,
                    subscription.currentPeriodEnd
                  )
                  const isExpiringSoon = progress > 80

                  return (
                    <Card key={subscription.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge 
                            className={`${getStatusColor(subscription.status)} text-white`}
                          >
                            {subscription.status}
                          </Badge>
                          {isExpiringSoon && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {subscription.model.name}
                        </CardTitle>
                        <CardDescription>
                          by {subscription.model.creator.displayName}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Plan:</span>
                            <span className="font-medium">
                              {subscription.plan.name}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Price:</span>
                            <span className="font-medium">
                              ${subscription.plan.price} {subscription.plan.unit}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Time Remaining:</span>
                            <span className={`font-medium ${isExpiringSoon ? 'text-orange-500' : ''}`}>
                              {timeRemaining}
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className={`h-2 ${isExpiringSoon ? 'bg-orange-100' : ''}`}
                          />
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Expires {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/models/${subscription.model.id}`}
                            className="flex-1"
                          >
                            Use Model
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/models/${subscription.model.id}?extend=true`}
                            className="flex-1"
                          >
                            Extend
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions
              .filter(sub => sub.status !== "ACTIVE")
              .map((subscription) => (
                <Card key={subscription.id} className="opacity-75">
                  <CardHeader>
                    <Badge variant="secondary">
                      {subscription.status}
                    </Badge>
                    <CardTitle className="text-lg">
                      {subscription.model.name}
                    </CardTitle>
                    <CardDescription>
                      by {subscription.model.creator.displayName}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Expired on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/models/${subscription.model.id}`}
                      className="w-full"
                    >
                      Resubscribe
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Coming soon - Track your API usage, costs, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>Usage analytics and billing insights will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 