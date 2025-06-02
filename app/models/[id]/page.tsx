"use client"

import { useState } from "react"
import { ArrowLeft, Star, Download, Heart, Share, Play, ShoppingCart, Clock, Zap } from "lucide-react"
import { ModelPlayground } from "@/components/models/model-playground"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function ModelDetailPage() {
  const [isLiked, setIsLiked] = useState(false)
  const [isInCart, setIsInCart] = useState(false)

  const model = {
    id: "1",
    name: "LLaMA 2 70B Chat",
    creator: "Meta AI",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    description:
      "LLaMA 2-Chat is a collection of fine-tuned large language models (LLMs) ranging in scale from 7B to 70B parameters. This is the 70B parameter version optimized for dialogue use cases.",
    category: "Natural Language Processing",
    architecture: "LLaMA",
    license: "Commercial",
    rating: 4.8,
    downloads: 125000,
    pricing: { type: "premium", price: 0.02, unit: "1k tokens" },
    performance: { accuracy: 94, latency: 150 },
    tags: ["chat", "reasoning", "multilingual", "instruction-following"],
    version: "2.0.1",
    lastUpdated: "2024-01-15",
    modelSize: "70B parameters",
    contextLength: "4096 tokens",
  }

  const handleAddToCart = () => {
    setIsInCart(!isInCart)
    // Add to cart logic here
  }

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/models">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Models
        </Link>
      </Button>

      {/* Model Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="flex items-start space-x-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={model.creatorAvatar || "/placeholder.svg"} />
              <AvatarFallback>{model.creator[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{model.name}</h1>
              <p className="text-lg text-muted-foreground mb-3">by {model.creator}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge>{model.category}</Badge>
                <Badge variant="outline">{model.architecture}</Badge>
                <Badge variant="secondary">{model.license}</Badge>
                {model.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground">{model.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{model.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">Rating</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Download className="h-4 w-4" />
                <span className="font-semibold">{model.downloads.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">{model.performance.accuracy}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{model.performance.latency}ms</span>
              </div>
              <p className="text-sm text-muted-foreground">Latency</p>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">${model.pricing.price}</div>
                <div className="text-muted-foreground">per {model.pricing.unit}</div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Try Now
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isInCart ? "Remove from Cart" : "Add to Cart"}
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsLiked(!isLiked)}>
                  <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span>{model.version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Size:</span>
                  <span>{model.modelSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Context Length:</span>
                  <span>{model.contextLength}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{model.lastUpdated}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="playground" className="space-y-6">
        <TabsList>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="playground">
          <ModelPlayground />
        </TabsContent>

        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>Model Documentation</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Overview</h3>
              <p>
                LLaMA 2-Chat is a collection of fine-tuned large language models optimized for dialogue use cases...
              </p>

              <h3>Use Cases</h3>
              <ul>
                <li>Conversational AI assistants</li>
                <li>Customer support chatbots</li>
                <li>Content generation and editing</li>
                <li>Code explanation and debugging</li>
              </ul>

              <h3>Limitations</h3>
              <p>
                While LLaMA 2-Chat demonstrates strong performance, users should be aware of potential limitations...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { version: "2.0.1", date: "2024-01-15", changes: "Bug fixes and performance improvements" },
                  {
                    version: "2.0.0",
                    date: "2023-12-01",
                    changes: "Major update with improved reasoning capabilities",
                  },
                  { version: "1.5.2", date: "2023-10-15", changes: "Enhanced multilingual support" },
                ].map((release) => (
                  <div key={release.version} className="border-l-2 border-muted pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">v{release.version}</h4>
                      <span className="text-sm text-muted-foreground">{release.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{release.changes}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>User Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    user: "Alex Chen",
                    rating: 5,
                    comment: "Excellent performance for conversational AI. The reasoning capabilities are impressive.",
                    date: "2024-01-10",
                  },
                  {
                    user: "Sarah Johnson",
                    rating: 4,
                    comment: "Great model overall, though latency could be improved for real-time applications.",
                    date: "2024-01-08",
                  },
                  {
                    user: "Mike Rodriguez",
                    rating: 5,
                    comment: "Best-in-class for instruction following. Highly recommended for enterprise use.",
                    date: "2024-01-05",
                  },
                ].map((review, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{review.user[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{review.user}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm">{review.comment}</p>
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
