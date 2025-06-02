"use client"

import { useState } from "react"
import { Key, Copy, Plus, Trash2, Eye, EyeOff, Calendar, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: "1",
      name: "Production API Key",
      key: "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      created: "2024-01-15",
      lastUsed: "2024-01-20",
      usage: "1.2M calls",
      permissions: ["read", "write"],
      status: "active",
    },
    {
      id: "2",
      name: "Development API Key",
      key: "sk-dev-def456ghi789jkl012mno345pqr678stu901vwx234yz567abc",
      created: "2024-01-10",
      lastUsed: "2024-01-19",
      usage: "45K calls",
      permissions: ["read"],
      status: "active",
    },
    {
      id: "3",
      name: "Testing Key",
      key: "sk-test-ghi789jkl012mno345pqr678stu901vwx234yz567abc123def",
      created: "2024-01-05",
      lastUsed: "Never",
      usage: "0 calls",
      permissions: ["read"],
      status: "inactive",
    },
  ])

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    description: "",
    permissions: "read",
  })

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const maskKey = (key: string) => {
    return key.slice(0, 12) + "..." + key.slice(-8)
  }

  const deleteKey = (keyId: string) => {
    setApiKeys((keys) => keys.filter((key) => key.id !== keyId))
  }

  const createNewKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: newKeyData.name,
      key: `sk-${newKeyData.permissions}-${Math.random().toString(36).substring(2, 50)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      usage: "0 calls",
      permissions: [newKeyData.permissions],
      status: "active" as const,
    }
    setApiKeys((keys) => [...keys, newKey])
    setNewKeyData({ name: "", description: "", permissions: "read" })
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for accessing AIMarket services</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production API Key"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyDescription">Description (Optional)</Label>
                <Textarea
                  id="keyDescription"
                  placeholder="Describe what this key will be used for..."
                  value={newKeyData.description}
                  onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissions">Permissions</Label>
                <Select
                  value={newKeyData.permissions}
                  onValueChange={(value) => setNewKeyData({ ...newKeyData, permissions: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="write">Read & Write</SelectItem>
                    <SelectItem value="admin">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createNewKey} className="w-full" disabled={!newKeyData.name}>
                Create API Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              {apiKeys.filter((key) => key.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.25M</div>
            <p className="text-xs text-muted-foreground">API calls made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100</div>
            <p className="text-xs text-muted-foreground">requests/minute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h</div>
            <p className="text-xs text-muted-foreground">ago</p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{apiKey.name}</h4>
                    <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>{apiKey.status}</Badge>
                    <Badge variant="outline">{apiKey.permissions.join(", ")}</Badge>
                  </div>
                  <div className="flex space-x-4 text-sm text-muted-foreground">
                    <span>Created: {apiKey.created}</span>
                    <span>Last used: {apiKey.lastUsed}</span>
                    <span>Usage: {apiKey.usage}</span>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteKey(apiKey.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex-1 font-mono text-sm bg-muted p-3 rounded">
                  {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                </div>
                <Button variant="outline" size="icon" onClick={() => toggleKeyVisibility(apiKey.id)}>
                  {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey.key)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Notice */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Keep your API keys secure and never share them publicly</p>
          <p>• Use different keys for different environments (development, staging, production)</p>
          <p>• Regularly rotate your API keys for enhanced security</p>
          <p>• Monitor your API usage to detect any unusual activity</p>
          <p>• Use the minimum required permissions for each key</p>
        </CardContent>
      </Card>
    </div>
  )
}
