"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Settings, 
  Key, 
  BarChart3, 
  CreditCard, 
  Shield, 
  Edit, 
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2
} from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  type: string
  createdAt: string
  creatorProfile?: {
    displayName: string
    bio?: string
    website?: string
    github?: string
    twitter?: string
    verified: boolean
    rating: number
    totalEarnings: number
  }
}

interface APIKey {
  id: string
  name: string
  keyHash: string
  lastUsed?: string
  rateLimit: number
  isActive: boolean
  createdAt: string
}

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  model: {
    name: string
    slug: string
  }
  plan: {
    name: string
    price: number
    unit: string
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({})

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    website: '',
    github: '',
    twitter: ''
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
      fetchApiKeys()
      fetchSubscriptions()
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.data.user)
        setFormData({
          name: data.data.user.name || '',
          bio: data.data.user.creatorProfile?.bio || '',
          website: data.data.user.creatorProfile?.website || '',
          github: data.data.user.creatorProfile?.github || '',
          twitter: data.data.user.creatorProfile?.twitter || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/user/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.data.apiKeys || [])
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/user/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.data.subscriptions || [])
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Profile updated successfully')
        setIsEditing(false)
        fetchProfile()
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const createApiKey = async () => {
    const name = prompt('Enter a name for your API key:')
    if (!name) return

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`API key created: ${data.data.key}`)
        fetchApiKeys()
      } else {
        toast.error('Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('Failed to create API key')
    }
  }

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('API key deleted')
        fetchApiKeys()
      } else {
        toast.error('Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile?.avatar} alt={profile?.name} />
          <AvatarFallback className="text-lg">
            {profile?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{profile?.name}</h1>
          <p className="text-muted-foreground">{profile?.email}</p>
          <div className="flex items-center space-x-2">
            <Badge variant={profile?.type === 'CREATOR' ? 'default' : 'secondary'}>
              {profile?.type}
            </Badge>
            {profile?.creatorProfile?.verified && (
              <Badge variant="destructive">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {profile?.type === 'CREATOR' && (
                <>
                  <Separator />
                  <h3 className="text-lg font-medium">Creator Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        disabled={!isEditing}
                        placeholder="https://yoursite.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        value={formData.github}
                        onChange={(e) => setFormData({...formData, github: e.target.value})}
                        disabled={!isEditing}
                        placeholder="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        value={formData.twitter}
                        onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                        disabled={!isEditing}
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Creator Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="font-medium">{profile.creatorProfile?.rating || 0}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Earnings:</span>
                          <span className="font-medium">${profile.creatorProfile?.totalEarnings || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Verified:</span>
                          <Badge variant={profile.creatorProfile?.verified ? "destructive" : "secondary"}>
                            {profile.creatorProfile?.verified ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {isEditing && (
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for programmatic access
                  </CardDescription>
                </div>
                <Button onClick={createApiKey}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys found. Create one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{key.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Key:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {showApiKeys[key.id] ? key.keyHash : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKeys({
                              ...showApiKeys,
                              [key.id]: !showApiKeys[key.id]
                            })}
                          >
                            {showApiKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          {showApiKeys[key.id] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(key.keyHash)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Manage your model subscriptions and access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active subscriptions found.
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{sub.model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Plan: {sub.plan.name} • ${sub.plan.price}/{sub.plan.unit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={sub.status === 'ACTIVE' ? "default" : "secondary"}>
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                View your API usage and model statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Settings panel coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
