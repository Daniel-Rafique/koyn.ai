"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { useState, useEffect } from "react"
import { Search, Filter, Users, Award } from "lucide-react"
import { CreatorCard } from "@/components/creators/creator-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { Skeleton } from "@/components/ui/skeleton"

// Sample creators data
const sampleCreators = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    company: "Meta AI",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "Leading researcher in large language models and conversational AI. Published 50+ papers on transformer architectures and neural language understanding.",
    location: "San Francisco, CA",
    joinedDate: "2021",
    verified: true,
    modelCount: 12,
    totalDownloads: 2500000,
    averageRating: 4.8,
    followers: 15420,
    specialties: ["NLP", "Transformers", "Conversational AI", "Research"],
    featuredModels: ["LLaMA 2 70B Chat", "LLaMA 2 13B", "LLaMA 2 7B"],
    socialLinks: {
      website: "https://sarahchen.ai",
      github: "https://github.com/sarahchen",
      twitter: "https://twitter.com/sarahchen_ai",
    },
  },
  {
    id: "2",
    name: "Alex Rodriguez",
    company: "OpenAI",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "Computer vision expert specializing in multimodal AI systems. Creator of CLIP and DALL-E series models.",
    location: "New York, NY",
    joinedDate: "2020",
    verified: true,
    modelCount: 8,
    totalDownloads: 1800000,
    averageRating: 4.7,
    followers: 12350,
    specialties: ["Computer Vision", "Multimodal AI", "Image Generation"],
    featuredModels: ["CLIP Vision Encoder", "DALL-E 3", "GPT-4 Vision"],
    socialLinks: {
      github: "https://github.com/alexrodriguez",
      linkedin: "https://linkedin.com/in/alexrodriguez",
    },
  },
  {
    id: "3",
    name: "Dr. Yuki Tanaka",
    company: "Stability AI",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "Generative AI researcher focused on diffusion models and creative applications. Pioneer in text-to-image synthesis.",
    location: "Tokyo, Japan",
    joinedDate: "2022",
    verified: true,
    modelCount: 15,
    totalDownloads: 3200000,
    averageRating: 4.9,
    followers: 18750,
    specialties: ["Diffusion Models", "Image Generation", "Creative AI"],
    featuredModels: ["Stable Diffusion XL", "Stable Video Diffusion", "SDXL Turbo"],
    socialLinks: {
      website: "https://yukitanaka.dev",
      github: "https://github.com/yukitanaka",
    },
  },
  {
    id: "4",
    name: "Marcus Johnson",
    company: "Anthropic",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "AI safety researcher working on constitutional AI and harmless language models. Expert in reinforcement learning from human feedback.",
    location: "London, UK",
    joinedDate: "2021",
    verified: true,
    modelCount: 6,
    totalDownloads: 950000,
    averageRating: 4.6,
    followers: 8920,
    specialties: ["AI Safety", "RLHF", "Constitutional AI"],
    featuredModels: ["Claude 3", "Claude 2", "Claude Instant"],
    socialLinks: {
      website: "https://marcusjohnson.ai",
      twitter: "https://twitter.com/marcus_ai",
    },
  },
  {
    id: "5",
    name: "Dr. Priya Sharma",
    company: "Google DeepMind",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "Reinforcement learning expert and robotics researcher. Leading work on multi-agent systems and embodied AI.",
    location: "Mountain View, CA",
    joinedDate: "2019",
    verified: true,
    modelCount: 9,
    totalDownloads: 1200000,
    averageRating: 4.5,
    followers: 11200,
    specialties: ["Reinforcement Learning", "Robotics", "Multi-Agent Systems"],
    featuredModels: ["Gemini Pro", "PaLM 2", "Bard"],
    socialLinks: {
      github: "https://github.com/priyasharma",
      linkedin: "https://linkedin.com/in/priyasharma",
    },
  },
  {
    id: "6",
    name: "Elena Volkov",
    company: "Hugging Face",
    avatar: "/placeholder.svg?height=64&width=64",
    bio: "Open source AI advocate and transformer architecture specialist. Maintainer of popular NLP libraries and datasets.",
    location: "Paris, France",
    joinedDate: "2020",
    verified: true,
    modelCount: 23,
    totalDownloads: 4100000,
    averageRating: 4.7,
    followers: 22100,
    specialties: ["Open Source", "NLP", "Transformers", "Datasets"],
    featuredModels: ["BERT Large", "RoBERTa", "DistilBERT"],
    socialLinks: {
      website: "https://elenavolkov.dev",
      github: "https://github.com/elenavolkov",
      twitter: "https://twitter.com/elena_ai",
    },
  },
]

// Generate more creators
const generateMockCreators = (): any[] => {
  const creators: any[] = [...sampleCreators]
  const companies = ["Microsoft Research", "NVIDIA", "Cohere", "Mistral AI", "Adept", "Character.AI"]
  const locations = ["Seattle, WA", "Austin, TX", "Toronto, Canada", "Berlin, Germany", "Tel Aviv, Israel"]
  const specialties = [
    ["Audio Processing", "Speech Recognition", "TTS"],
    ["Computer Vision", "Object Detection", "Segmentation"],
    ["Time Series", "Forecasting", "Analytics"],
    ["Recommendation Systems", "Personalization", "ML"],
    ["Edge AI", "Mobile ML", "Optimization"],
  ]

  for (let i = 0; i < 20; i++) {
    const creator = {
      id: `creator-${i + 7}`,
      name: `Creator ${i + 7}`,
      company: companies[i % companies.length],
      avatar: `/placeholder.svg?height=64&width=64&text=${i + 7}`,
      bio: `AI researcher and developer with expertise in machine learning and artificial intelligence systems.`,
      location: locations[i % locations.length],
      joinedDate: `202${Math.floor(Math.random() * 4)}`,
      verified: Math.random() > 0.3,
      modelCount: Math.floor(Math.random() * 20) + 1,
      totalDownloads: Math.floor(Math.random() * 2000000) + 100000,
      averageRating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      followers: Math.floor(Math.random() * 50000) + 1000,
      specialties: specialties[i % specialties.length],
      featuredModels: [`Model ${i + 1}`, `Model ${i + 2}`, `Model ${i + 3}`],
      socialLinks: {
        github: `https://github.com/creator${i + 7}`,
        website: `https://creator${i + 7}.dev`,
        twitter: `https://twitter.com/creator${i + 7}`,
        linkedin: `https://linkedin.com/in/creator${i + 7}`
      },
    }
    creators.push(creator)
  }

  return creators
}

const mockCreators = generateMockCreators()

export default function CreatorsPage() {
  const [search, setSearch] = useState("")
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState("followers")
  const [filterBy, setFilterBy] = useState("all")

  const debouncedSearch = useDebounce(search, 500)

  const sortOptions = [
    { value: "followers", label: "Most Followers" },
    { value: "models", label: "Most Models" },
    { value: "rating", label: "Highest Rated" },
    { value: "downloads", label: "Most Downloads" },
    { value: "newest", label: "Newest" },
    { value: "name", label: "Name A-Z" },
  ]

  const filterOptions = [
    { value: "all", label: "All Creators" },
    { value: "verified", label: "Verified Only" },
    { value: "companies", label: "Companies" },
    { value: "individuals", label: "Individuals" },
  ]

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      let filteredCreators = mockCreators

      // Search filter
      if (debouncedSearch) {
        filteredCreators = filteredCreators.filter(
          (creator) =>
            creator.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            creator.company?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            creator.bio.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            creator.specialties.some((specialty: string) => specialty.toLowerCase().includes(debouncedSearch.toLowerCase())),
        )
      }

      // Category filter
      if (filterBy === "verified") {
        filteredCreators = filteredCreators.filter((creator) => creator.verified)
      } else if (filterBy === "companies") {
        filteredCreators = filteredCreators.filter((creator) => creator.company)
      } else if (filterBy === "individuals") {
        filteredCreators = filteredCreators.filter((creator) => !creator.company)
      }

      // Sort
      filteredCreators.sort((a, b) => {
        switch (sortBy) {
          case "followers":
            return b.followers - a.followers
          case "models":
            return b.modelCount - a.modelCount
          case "rating":
            return b.averageRating - a.averageRating
          case "downloads":
            return b.totalDownloads - a.totalDownloads
          case "name":
            return a.name.localeCompare(b.name)
          case "newest":
            return Number.parseInt(b.joinedDate) - Number.parseInt(a.joinedDate)
          default:
            return 0
        }
      })

      setCreators(filteredCreators)
      setLoading(false)
    }, 500)
  }, [debouncedSearch, sortBy, filterBy])

  const topCreators = creators.slice(0, 3)

  return (
    <div className="container py-8">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Meet the AI Creators</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the brilliant minds behind the world's most advanced AI models. Connect with researchers,
              developers, and innovators shaping the future of artificial intelligence.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search creators, companies, or specialties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-muted-foreground">Active Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">150+</div>
                <div className="text-sm text-muted-foreground">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50M+</div>
                <div className="text-sm text-muted-foreground">Model Downloads</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Top Creators Spotlight */}
        <section className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Top Creators This Month</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topCreators.map((creator, index) => (
              <Card key={creator.id} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                </div>
                <CardHeader className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                    <AvatarFallback>
                      {creator.name
                        .split(" ")
                        .map((n: any) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{creator.name}</CardTitle>
                  {creator.company && <p className="text-sm text-muted-foreground">{creator.company}</p>}
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{creator.modelCount}</div>
                      <div className="text-muted-foreground">Models</div>
                    </div>
                    <div>
                      <div className="font-semibold">{creator.followers.toLocaleString()}</div>
                      <div className="text-muted-foreground">Followers</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Filters and Sort */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-sm font-medium whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {creators.length} creator{creators.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
