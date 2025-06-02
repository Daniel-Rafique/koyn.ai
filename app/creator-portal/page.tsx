"use client"

import { useState } from "react"
import { BarChart, DollarSign, Download, Eye, Plus, TrendingUp, Users, Zap, Calendar, Star, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// Mock data - replace with real API calls
const mockCreatorData = {
  profile: {
    id: "creator-1",
    name: "Dr. Sarah Chen",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "AI Researcher specializing in NLP and Computer Vision",
    verified: true,
    totalEarnings: 85420.50,
    totalDownloads: 234567,
    totalModels: 12,
    currentMonthEarnings: 12580.30,
    rating: 4.8,
    reviewCount: 342
  },
  monthlyEarnings: [
    { month: "Jan", earnings: 8500, downloads: 15000 },
    { month: "Feb", earnings: 9200, downloads: 18000 },
    { month: "Mar", earnings: 11000, downloads: 22000 },
    { month: "Apr", earnings: 10500, downloads: 20000 },
    { month: "May", earnings: 12580, downloads: 25000 },
  ],
  recentModels: [
    {
      id: "1",
      name: "Advanced Sentiment Analyzer",
      status: "published",
      downloads: 15420,
      earnings: 3840.50,
      rating: 4.9,
      lastUpdated: "2024-01-15"
    },
    {
      id: "2", 
      name: "Multi-language Translation",
      status: "published",
      downloads: 8950,
      earnings: 2237.50,
      rating: 4.7,
      lastUpdated: "2024-01-10"
    },
    {
      id: "3",
      name: "Image Classification Pro",
      status: "review",
      downloads: 0,
      earnings: 0,
      rating: 0,
      lastUpdated: "2024-01-20"
    }
  ],
  recentPayouts: [
    {
      id: "1",
      amount: 2500.00,
      status: "completed",
      date: "2024-01-01",
      method: "Stripe"
    },
    {
      id: "2",
      amount: 3200.00,
      status: "processing",
      date: "2024-01-15",
      method: "Crypto"
    }
  ]
}

export default function CreatorPortalPage() {
  const [timeRange, setTimeRange] = useState("6m")
  const { profile, monthlyEarnings, recentModels, recentPayouts } = mockCreatorData

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Creator Portal</h1>
          <p className="text-muted-foreground">Manage your AI models and track your earnings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/creator-portal/models/new">
              <Plus className="h-4 w-4 mr-2" />
              Upload Model
            </Link>
          </Button>
        </div>
      </div>

      {/* Creator Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                {profile.verified && (
                  <Badge variant="default" className="bg-blue-500">
                    Verified
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base">{profile.bio}</CardDescription>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{profile.rating}</span>
                  <span className="text-muted-foreground">({formatNumber(profile.reviewCount)} reviews)</span>
                </div>
                <Badge variant="outline">{profile.totalModels} models</Badge>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/creator-portal/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(profile.currentMonthEarnings)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(profile.totalDownloads)}</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.totalModels}</div>
            <p className="text-xs text-muted-foreground">
              8 published, 2 in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.rating}</div>
            <p className="text-xs text-muted-foreground">
              Based on {formatNumber(profile.reviewCount)} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Earnings Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
                <CardDescription>Your earnings over the last 5 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyEarnings.map((month) => (
                    <div key={month.month} className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium">{month.month}</div>
                      <div className="flex-1">
                        <Progress 
                          value={(month.earnings / 15000) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div className="text-sm font-medium w-20 text-right">
                        {formatCurrency(month.earnings)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates on your models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Advanced Sentiment Analyzer approved</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New review on Translation Model</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Image Classification Pro submitted for review</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payout of $2,500 completed</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Models</h2>
            <Button asChild>
              <Link href="/creator-portal/models/new">
                <Plus className="h-4 w-4 mr-2" />
                Upload New Model
              </Link>
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(model.downloads)}</TableCell>
                    <TableCell>{formatCurrency(model.earnings)}</TableCell>
                    <TableCell>
                      {model.rating > 0 ? (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{model.rating}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{model.lastUpdated}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/creator-portal/models/${model.id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/creator-portal/models/${model.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed analytics for your models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Advanced analytics coming soon...</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="font-medium">{recentModels[0].name}</div>
                  <div className="text-2xl font-bold">{formatNumber(recentModels[0].downloads)}</div>
                  <p className="text-sm text-muted-foreground">downloads this month</p>
                  <Progress value={75} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Payouts</h2>
            <Button>Request Payout</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(5420.30)}</div>
                <p className="text-sm text-muted-foreground">Ready for withdrawal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(3200.00)}</div>
                <p className="text-sm text-muted-foreground">Processing payout</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(76800.20)}</div>
                <p className="text-sm text-muted-foreground">All time payouts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{payout.date}</TableCell>
                      <TableCell>{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>{payout.method}</TableCell>
                      <TableCell>
                        <Badge className={payout.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
