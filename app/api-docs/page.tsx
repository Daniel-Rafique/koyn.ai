"use client"

import { useState } from "react"
import { Copy, Play, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function APIDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("list-models")

  const endpoints = [
    {
      id: "list-models",
      method: "GET",
      path: "/v1/models",
      title: "List Models",
      description: "Retrieve a list of available AI models",
      parameters: [
        { name: "category", type: "string", required: false, description: "Filter by model category" },
        { name: "limit", type: "integer", required: false, description: "Number of results to return (max 100)" },
        { name: "offset", type: "integer", required: false, description: "Number of results to skip" },
      ],
      response: {
        "200": {
          description: "Successful response",
          example: {
            data: [
              {
                id: "llama-2-70b-chat",
                name: "LLaMA 2 70B Chat",
                category: "nlp",
                pricing: { type: "premium", price: 0.02, unit: "1k tokens" },
              },
            ],
            total: 1,
            limit: 10,
            offset: 0,
          },
        },
      },
    },
    {
      id: "get-model",
      method: "GET",
      path: "/v1/models/{model_id}",
      title: "Get Model",
      description: "Retrieve details about a specific model",
      parameters: [
        { name: "model_id", type: "string", required: true, description: "The ID of the model to retrieve" },
      ],
      response: {
        "200": {
          description: "Successful response",
          example: {
            id: "llama-2-70b-chat",
            name: "LLaMA 2 70B Chat",
            description: "A large language model fine-tuned for conversational use cases",
            category: "nlp",
            architecture: "transformer",
            parameters: "70B",
            context_length: 4096,
            pricing: { type: "premium", price: 0.02, unit: "1k tokens" },
          },
        },
      },
    },
    {
      id: "run-inference",
      method: "POST",
      path: "/v1/inference",
      title: "Run Inference",
      description: "Execute a model with given input",
      parameters: [
        { name: "model", type: "string", required: true, description: "The model ID to use" },
        { name: "input", type: "string", required: true, description: "The input text or data" },
        { name: "parameters", type: "object", required: false, description: "Model-specific parameters" },
      ],
      response: {
        "200": {
          description: "Successful response",
          example: {
            output: "Quantum computing is a revolutionary technology...",
            usage: { input_tokens: 10, output_tokens: 150, total_tokens: 160 },
            model: "llama-2-70b-chat",
            finish_reason: "stop",
          },
        },
      },
    },
  ]

  const codeExamples = {
    javascript: `const response = await fetch('https://api.aimarket.com/v1/models', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.get(
    'https://api.aimarket.com/v1/models',
    headers={
        'Authorization': 'Bearer your-api-key',
        'Content-Type': 'application/json'
    }
)

data = response.json()
print(data)`,
    curl: `curl -X GET "https://api.aimarket.com/v1/models" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"`,
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800"
      case "POST":
        return "bg-blue-100 text-blue-800"
      case "PUT":
        return "bg-yellow-100 text-yellow-800"
      case "DELETE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">API Reference</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete API documentation for integrating AI models into your applications.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                      className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                        selectedEndpoint === endpoint.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                        <span className="font-medium text-sm">{endpoint.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{endpoint.path}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  Authentication
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  Rate Limits
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  Error Codes
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  SDKs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {endpoints
              .filter((endpoint) => endpoint.id === selectedEndpoint)
              .map((endpoint) => (
                <div key={endpoint.id} className="space-y-6">
                  {/* Endpoint Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                        <code className="text-lg font-mono">{endpoint.path}</code>
                      </div>
                      <CardTitle className="text-2xl">{endpoint.title}</CardTitle>
                      <p className="text-muted-foreground">{endpoint.description}</p>
                    </CardHeader>
                  </Card>

                  {/* Parameters */}
                  {endpoint.parameters.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Parameters</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {endpoint.parameters.map((param) => (
                            <div key={param.name} className="border-l-2 border-muted pl-4">
                              <div className="flex items-center space-x-2 mb-1">
                                <code className="font-mono text-sm">{param.name}</code>
                                <Badge variant="outline">{param.type}</Badge>
                                {param.required && <Badge variant="destructive">required</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{param.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Code Examples */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Code Examples</CardTitle>
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
                            <div className="relative">
                              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{code}</code>
                              </pre>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => navigator.clipboard.writeText(code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Response */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(endpoint.response).map(([status, response]) => (
                        <Collapsible key={status} defaultOpen={status === "200"}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-0 h-auto mb-4">
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={
                                    status === "200" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }
                                >
                                  {status}
                                </Badge>
                                <span>{response.description}</span>
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{JSON.stringify(response.example, null, 2)}</code>
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Try It Out */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Try It Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Play className="mr-2 h-4 w-4" />
                        Test This Endpoint
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
