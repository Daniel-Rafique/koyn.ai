"use client"

import { useState } from "react"
import { ArrowLeft, Star, Users, MapPin, Calendar, ExternalLink, Github, Twitter, Linkedin, Globe } from "lucide-react"
import { ModelCard } from "@/components/models/model-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Model } from "@/lib/types"

export default function CreatorProfilePage() {
  const [isFollowing, setIsFollowing] = useState(false)

  // Mock creator data
  const creator = {
    id: "1",
    name: "Dr. Sarah Chen",
    company: "Meta AI",
    avatar: "/placeholder.svg?height=120&width=120",
    bio: "Leading researcher in large language models and conversational AI. Published 50+ papers on transformer architectures and neural language understanding. Passionate about making AI more accessible and beneficial for everyone.",
    location: "San Francisco, CA",
    joinedDate: "March 2021",
    verified: true,
    modelCount: 12,
    totalDownloads: 2500000,
    averageRating: 4.8,
    followers: 15420,
    following: 234,
    specialties: ["NLP", "Transformers", "Conversational AI", "Research", "Machine Learning"],
    socialLinks: {
      website: "https://sarahchen.ai",
      github: "https://github.com/sarahchen",
      twitter: "https://twitter.com/sarahchen_ai",
      linkedin: "https://linkedin.com/in/sarahchen",
    },
    achievements: [
      "Top 1% Creator 2024",
      "Most Downloaded Model 2023",
      "Research Excellence Award",
      "Community Choice Award",
    ],
  }

  // Mock models data - properly typed
  const creatorModels: Model[] = [
    {
      id: "1",
      name: "LLaMA 2 70B Chat",
      slug: "llama-2-70b-chat",
      description: "A large language model fine-tuned for conversational use cases with exceptional reasoning capabilities.",
      longDescription: "LLaMA 2-Chat optimized for dialogue use cases.",
      creatorId: "1",
      creator: {
        id: "1",
        userId: "user-1", 
        displayName: "Dr. Sarah Chen",
        bio: "Leading AI researcher",
        verified: true,
        rating: 4.8,
        totalEarnings: 250000,
        totalDownloads: 125000,
        createdAt: new Date()
      },
      category: "nlp",
      architecture: "LLaMA",
      tasks: ["text-generation", "conversation"],
      modelSize: "70B parameters",
      inputModalities: ["text"],
      outputModalities: ["text"],
      benchmarks: [{ name: "MMLU", dataset: "MMLU", metric: "accuracy", value: 68.9 }],
      averageLatency: 150,
      license: "commercial",
      version: "2.0.1",
      versions: [],
      tags: ["chat", "reasoning", "multilingual"],
      pricing: [{
        id: "plan-1",
        modelId: "1",
        name: "Premium",
        type: "premium",
        price: 0.02,
        unit: "1k tokens",
        features: ["API Access"],
        supportLevel: "standard",
        active: true
      }],
      rating: 4.8,
      reviewCount: 234,
      downloadCount: 125000,
      apiCallCount: 1500000,
      status: "published",
      featured: true,
      modelFiles: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "website":
        return <Globe className="h-4 w-4" />
      case "github":
        return <Github className="h-4 w-4" />
      case "twitter":
        return <Twitter className="h-4 w-4" />
      case "linkedin":
        return <Linkedin className="h-4 w-4" />
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Creators
      </Button>

      {/* Creator Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="flex items-start space-x-6 mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                <AvatarFallback>
                  {creator.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {creator.verified && (
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-white fill-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{creator.name}</h1>
              {creator.company && <p className="text-lg text-muted-foreground mb-3">{creator.company}</p>}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{creator.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {creator.joinedDate}</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">{creator.bio}</p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-2 mb-4">
                {creator.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex space-x-2">
                {Object.entries(creator.socialLinks).map(([platform, url]) => (
                  <Button key={platform} variant="outline" size="icon" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {getSocialIcon(platform)}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-semibold text-2xl mb-1">{creator.modelCount}</div>
              <p className="text-sm text-muted-foreground">Models</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-semibold text-2xl mb-1">{creator.followers.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-semibold text-2xl mb-1">{creator.totalDownloads.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-semibold text-2xl mb-1">{creator.averageRating}</div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" size="lg" onClick={() => setIsFollowing(!isFollowing)}>
                <Users className="mr-2 h-4 w-4" />
                {isFollowing ? "Following" : "Follow"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <span>{creator.followers.toLocaleString()} followers</span>
                <span className="mx-2">•</span>
                <span>{creator.following} following</span>
              </div>

              <Separator />

              {/* Achievements */}
              <div>
                <h4 className="font-medium mb-3">Achievements</h4>
                <div className="space-y-2">
                  {creator.achievements.map((achievement) => (
                    <div key={achievement} className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList>
          <TabsTrigger value="models">Models ({creator.modelCount})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Published", item: "LLaMA 2 70B Chat v2.1", time: "2 days ago" },
                  { action: "Updated", item: "LLaMA 2 13B Instruct", time: "1 week ago" },
                  { action: "Joined", item: "AI Safety Working Group", time: "2 weeks ago" },
                  { action: "Published", item: "Research Paper: Scaling Laws", time: "1 month ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-medium">{activity.action}</span>
                      <span className="mx-2">•</span>
                      <span>{activity.item}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About {creator.name}</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Dr. Sarah Chen is a leading researcher in the field of artificial intelligence, with a particular focus
                on large language models and conversational AI systems. She currently leads the LLaMA research team at
                Meta AI, where she has been instrumental in developing some of the most advanced open-source language
                models available today.
              </p>

              <h3>Research Interests</h3>
              <ul>
                <li>Large Language Model Architecture</li>
                <li>Conversational AI and Dialogue Systems</li>
                <li>Neural Language Understanding</li>
                <li>AI Safety and Alignment</li>
                <li>Multimodal AI Systems</li>
              </ul>

              <h3>Education</h3>
              <ul>
                <li>Ph.D. in Computer Science, Stanford University (2018)</li>
                <li>M.S. in Machine Learning, Carnegie Mellon University (2014)</li>
                <li>B.S. in Computer Science, MIT (2012)</li>
              </ul>

              <h3>Publications</h3>
              <p>
                Dr. Chen has published over 50 peer-reviewed papers in top-tier conferences including NeurIPS, ICML,
                ICLR, and ACL. Her work has been cited over 10,000 times and has significantly influenced the
                development of modern language models.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
