"use client"

import { useState } from "react"
import { Search, Book, Code, Zap, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const docSections = [
    {
      title: "Getting Started",
      icon: <Zap className="h-5 w-5" />,
      items: [
        { title: "Quick Start Guide", description: "Get up and running in 5 minutes", time: "5 min read" },
        { title: "Authentication", description: "API keys and authentication methods", time: "3 min read" },
        { title: "Making Your First Request", description: "Send your first API call", time: "4 min read" },
        { title: "Error Handling", description: "Handle errors gracefully", time: "6 min read" },
      ],
    },
    {
      title: "API Reference",
      icon: <Code className="h-5 w-5" />,
      items: [
        { title: "Models API", description: "List, search, and get model details", time: "8 min read" },
        { title: "Inference API", description: "Run models and get predictions", time: "10 min read" },
        { title: "Billing API", description: "Manage usage and billing", time: "5 min read" },
        { title: "Webhooks", description: "Real-time notifications", time: "7 min read" },
      ],
    },
    {
      title: "SDKs & Libraries",
      icon: <Book className="h-5 w-5" />,
      items: [
        { title: "JavaScript SDK", description: "Official JavaScript/TypeScript SDK", time: "6 min read" },
        { title: "Python SDK", description: "Official Python SDK", time: "6 min read" },
        { title: "REST API", description: "Direct HTTP API access", time: "4 min read" },
        { title: "GraphQL API", description: "Query with GraphQL", time: "8 min read" },
      ],
    },
    {
      title: "Security",
      icon: <Shield className="h-5 w-5" />,
      items: [
        { title: "API Security", description: "Best practices for secure API usage", time: "7 min read" },
        { title: "Rate Limiting", description: "Understanding rate limits", time: "4 min read" },
        { title: "Data Privacy", description: "How we handle your data", time: "5 min read" },
        { title: "Compliance", description: "SOC2, GDPR, and other standards", time: "6 min read" },
      ],
    },
  ]

  const codeExamples = {
    javascript: `import { AIMarket } from '@aimarket/sdk';

const client = new AIMarket({
  apiKey: 'your-api-key'
});

// List available models
const models = await client.models.list({
  category: 'nlp',
  limit: 10
});

// Run inference
const result = await client.inference.run({
  model: 'llama-2-70b-chat',
  input: 'Explain quantum computing',
  parameters: {
    temperature: 0.7,
    max_tokens: 150
  }
});

console.log(result.output);`,
    python: `from aimarket import AIMarket

client = AIMarket(api_key="your-api-key")

# List available models
models = client.models.list(
    category="nlp",
    limit=10
)

# Run inference
result = client.inference.run(
    model="llama-2-70b-chat",
    input="Explain quantum computing",
    parameters={
        "temperature": 0.7,
        "max_tokens": 150
    }
)

print(result.output)`,
    curl: `# List models
curl -X GET "https://api.aimarket.com/v1/models" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"

# Run inference
curl -X POST "https://api.aimarket.com/v1/inference" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-2-70b-chat",
    "input": "Explain quantum computing",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 150
    }
  }'`,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Documentation</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to integrate AI models into your applications. From quick start guides to detailed API
              references.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <span>Get API Key</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Sign up and get your API key from the dashboard</p>
                <Button variant="outline" size="sm">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <span>Install SDK</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Install our SDK for your preferred language</p>
                <code className="text-xs bg-muted p-2 rounded block">npm install @aimarket/sdk</code>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <span>Make Request</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Start using AI models in your application</p>
                <Button variant="outline" size="sm">
                  View Examples
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Code Examples</h2>
          <Card>
            <CardHeader>
              <CardTitle>Basic Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Documentation Sections */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {docSections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                      >
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Badge variant="outline">{item.time}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
