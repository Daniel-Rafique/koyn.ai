"use client"

import { useState } from "react"
import { Play, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export function ModelPlayground() {
  const [input, setInput] = useState("Explain quantum computing in simple terms.")
  const [output, setOutput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [temperature, setTemperature] = useState([0.7])
  const [maxTokens, setMaxTokens] = useState([150])

  const handleRun = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setOutput(
        "Quantum computing is a revolutionary technology that uses the principles of quantum mechanics to process information. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or 'qubits' that can exist in multiple states simultaneously through a property called superposition...",
      )
      setIsLoading(false)
    }, 2000)
  }

  const codeExamples = {
    javascript: `import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.aimarket.com/v1'
});

const response = await client.chat.completions.create({
  model: 'llama-2-70b-chat',
  messages: [
    { role: 'user', content: '${input}' }
  ],
  temperature: ${temperature[0]},
  max_tokens: ${maxTokens[0]}
});`,
    python: `import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="https://api.aimarket.com/v1"
)

response = client.chat.completions.create(
    model="llama-2-70b-chat",
    messages=[
        {"role": "user", "content": "${input}"}
    ],
    temperature=${temperature[0]},
    max_tokens=${maxTokens[0]}
)`,
    curl: `curl -X POST "https://api.aimarket.com/v1/chat/completions" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-2-70b-chat",
    "messages": [
      {"role": "user", "content": "${input}"}
    ],
    "temperature": ${temperature[0]},
    "max_tokens": ${maxTokens[0]}
  }'`,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Interactive Playground
            <Badge variant="secondary">LLaMA 2 70B Chat</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input */}
          <div>
            <Label htmlFor="input" className="text-sm font-medium">
              Input
            </Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your prompt here..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Temperature: {temperature[0]}</Label>
              <Slider value={temperature} onValueChange={setTemperature} max={2} min={0} step={0.1} className="mt-2" />
            </div>
            <div>
              <Label className="text-sm font-medium">Max Tokens: {maxTokens[0]}</Label>
              <Slider value={maxTokens} onValueChange={setMaxTokens} max={500} min={50} step={10} className="mt-2" />
            </div>
          </div>

          {/* Run Button */}
          <Button onClick={handleRun} disabled={isLoading} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? "Running..." : "Run Model"}
          </Button>

          {/* Output */}
          {output && (
            <div>
              <Label className="text-sm font-medium">Output</Label>
              <div className="mt-1 p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{output}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Code</CardTitle>
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
    </div>
  )
}
