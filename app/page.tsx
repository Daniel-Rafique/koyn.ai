"use client"

import { useState } from "react"
import { Search, TrendingUp, Zap, Users } from "lucide-react"
import { ModelCard } from "@/components/models/model-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Model } from "@/lib/types"

// Use properly typed Model data
const featuredModels: Model[] = [
  {
    id: "1",
    name: "LLaMA 2 70B Chat",
    slug: "llama-2-70b-chat",
    description: "A large language model fine-tuned for conversational use cases with exceptional reasoning capabilities.",
    longDescription: "LLaMA 2-Chat is a collection of fine-tuned large language models (LLMs) ranging in scale from 7B to 70B parameters.",
    creatorId: "creator-1",
    creator: {
      id: "creator-1",
      userId: "user-1",
      displayName: "Meta AI",
      bio: "Leading AI research company",
      verified: true,
      rating: 4.9,
      totalEarnings: 250000,
      totalDownloads: 125000,
      createdAt: new Date()
    },
    category: "nlp",
    architecture: "LLaMA",
    tasks: ["text-generation", "conversation", "reasoning"],
    modelSize: "70B parameters",
    contextLength: "4096 tokens",
    inputModalities: ["text"],
    outputModalities: ["text"],
    benchmarks: [
      { name: "MMLU", dataset: "MMLU", metric: "accuracy", value: 68.9 }
    ],
    averageLatency: 150,
    license: "commercial",
    version: "2.0.1",
    versions: [],
    tags: ["chat", "reasoning", "multilingual"],
    pricing: [
      {
        id: "plan-1",
        modelId: "1",
        name: "Pay per Use",
        type: "premium",
        price: 0.02,
        unit: "1k tokens",
        features: ["API Access", "Commercial Use"],
        supportLevel: "standard",
        active: true
      }
    ],
    rating: 4.8,
    reviewCount: 234,
    downloadCount: 125000,
    apiCallCount: 1500000,
    status: "published",
    featured: true,
    modelFiles: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "CLIP Vision Encoder", 
    slug: "clip-vision-encoder",
    description: "Connects text and images in a single embedding space for powerful multimodal applications.",
    longDescription: "CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs.",
    creatorId: "creator-2",
    creator: {
      id: "creator-2",
      userId: "user-2",
      displayName: "OpenAI",
      bio: "AI research company",
      verified: true,
      rating: 4.8,
      totalEarnings: 180000,
      totalDownloads: 89000,
      createdAt: new Date()
    },
    category: "computer-vision",
    architecture: "Transformer",
    tasks: ["image-classification", "image-to-text"],
    modelSize: "400M parameters",
    inputModalities: ["image", "text"],
    outputModalities: ["embeddings"],
    benchmarks: [
      { name: "ImageNet", dataset: "ImageNet", metric: "top-1 accuracy", value: 76.2 }
    ],
    averageLatency: 45,
    license: "open-source",
    version: "1.0.0",
    versions: [],
    tags: ["multimodal", "embeddings", "zero-shot"],
    pricing: [
      {
        id: "plan-2",
        modelId: "2",
        name: "Free Tier",
        type: "free",
        price: 0,
        unit: "request",
        features: ["1000 requests/month"],
        supportLevel: "community",
        active: true
      }
    ],
    rating: 4.6,
    reviewCount: 156,
    downloadCount: 89000,
    apiCallCount: 890000,
    status: "published",
    featured: true,
    modelFiles: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Discover the Future of AI</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access cutting-edge AI models from leading researchers and companies. Integrate powerful AI capabilities
              into your applications with just a few lines of code.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for models, creators, or capabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">2,500+</div>
                <div className="text-sm text-muted-foreground">AI Models</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50k+</div>
                <div className="text-sm text-muted-foreground">Developers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">1M+</div>
                <div className="text-sm text-muted-foreground">API Calls/Day</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs defaultValue="featured" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="featured" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Featured</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Trending</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Most Popular</span>
              </TabsTrigger>
            </TabsList>

            <Button variant="outline">View All Models</Button>
          </div>

          <TabsContent value="featured" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredModels.slice(0, 3).map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredModels.slice(1, 4).map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Categories Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Natural Language Processing", count: 245, icon: "💬" },
              { name: "Computer Vision", count: 189, icon: "👁️" },
              { name: "Audio Processing", count: 67, icon: "🎵" },
              { name: "Reinforcement Learning", count: 34, icon: "🎮" },
            ].map((category) => (
              <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-2xl font-bold">{category.count}</p>
                  <p className="text-sm text-muted-foreground">models available</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
