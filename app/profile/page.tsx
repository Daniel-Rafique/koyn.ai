"use client"

import { useState } from "react"
import { MapPin, Calendar, Edit, Save, X, Key, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "AI enthusiast and developer building the next generation of intelligent applications.",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
    company: "TechCorp Inc.",
    joinedDate: "January 2023",
  })

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    modelUpdates: false,
    securityAlerts: true,
    marketingEmails: false,
  })

  const apiKeys = [
    {
      id: "1",
      name: "Production API Key",
      key: "sk-proj-abc123...xyz789",
      created: "2024-01-15",
      lastUsed: "2024-01-20",
      usage: "1.2M calls",
    },
    {
      id: "2",
      name: "Development API Key",
      key: "sk-dev-def456...uvw012",
      created: "2024-01-10",
      lastUsed: "2024-01-19",
      usage: "45K calls",
    },
  ]

  const usageStats = {
    currentPlan: "Pro",
    apiCalls: {
      used: 75000,
      limit: 100000,
    },
    billing: {
      currentPeriod: "Jan 1 - Jan 31, 2024",
      amount: "$29.00",
      nextBilling: "Feb 1, 2024",
    },
  }

  const handleSave = () => {
    setIsEditing(false)
    // Save profile logic here
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form logic here
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt={profile.name} />
                  <AvatarFallback>
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                <p className="text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary">{usageStats.currentPlan} Plan</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {profile.joinedDate}</span>
                </div>
                <Button variant="outline" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile Picture
                </Button>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>API Calls</span>
                    <span>
                      {usageStats.apiCalls.used.toLocaleString()} / {usageStats.apiCalls.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(usageStats.apiCalls.used / usageStats.apiCalls.limit) * 100}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current Period</span>
                    <span>{usageStats.billing.currentPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span className="font-medium">{usageStats.billing.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Billing</span>
                    <span>{usageStats.billing.nextBilling}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={profile.company}
                          onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* API Keys Tab */}
              <TabsContent value="api-keys">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>API Keys</CardTitle>
                    <Button>
                      <Key className="mr-2 h-4 w-4" />
                      Create New Key
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
                        <Card key={key.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <h4 className="font-medium">{key.name}</h4>
                                <code className="text-sm bg-muted px-2 py-1 rounded">{key.key}</code>
                                <div className="flex space-x-4 text-sm text-muted-foreground">
                                  <span>Created: {key.created}</span>
                                  <span>Last used: {key.lastUsed}</span>
                                  <span>Usage: {key.usage}</span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Copy
                                </Button>
                                <Button variant="destructive" size="sm">
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{usageStats.currentPlan} Plan</h3>
                          <p className="text-muted-foreground">100,000 API calls per month</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$29/month</div>
                          <Button variant="outline" size="sm">
                            Change Plan
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-muted-foreground">Expires 12/25</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Update
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Billing History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { date: "Jan 1, 2024", amount: "$29.00", status: "Paid" },
                          { date: "Dec 1, 2023", amount: "$29.00", status: "Paid" },
                          { date: "Nov 1, 2023", amount: "$29.00", status: "Paid" },
                        ].map((invoice, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div>
                              <p className="font-medium">{invoice.date}</p>
                              <p className="text-sm text-muted-foreground">Pro Plan</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{invoice.amount}</p>
                              <Badge variant="outline">{invoice.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new features and improvements
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailUpdates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Model Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified when new models are available</p>
                      </div>
                      <Switch
                        checked={notifications.modelUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, modelUpdates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Security Alerts</Label>
                        <p className="text-sm text-muted-foreground">Important security notifications and alerts</p>
                      </div>
                      <Switch
                        checked={notifications.securityAlerts}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, securityAlerts: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Promotional content and special offers</p>
                      </div>
                      <Switch
                        checked={notifications.marketingEmails}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
