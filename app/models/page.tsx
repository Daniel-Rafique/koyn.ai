"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Grid, List, SlidersHorizontal, X, ArrowUpDown, TrendingUp, Star, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { MODEL_CATEGORIES, SORT_OPTIONS } from "@/lib/constants"
import { ModelFilters, ModelCategory } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

// Simplified model interface for the UI
interface SimpleModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ModelCategory;
  architecture: string;
  tags: string[];
  creator: {
    id: string;
    displayName: string;
    verified: boolean;
  };
  pricing: Array<{
    id: string;
    name: string;
    type: 'free' | 'premium' | 'freemium';
    price: number;
    unit: string;
    active: boolean;
  }>;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  featured: boolean;
  license: string;
  createdAt: Date;
}

// Mock data - replace with API calls
const mockModels: SimpleModel[] = [
  {
    id: "1",
    name: "LLaMA 2 70B Chat",
    slug: "llama-2-70b-chat",
    description: "A large language model fine-tuned for conversational use cases with exceptional reasoning capabilities.",
    category: ModelCategory.NLP,
    architecture: "LLaMA",
    tags: ["chat", "reasoning", "multilingual"],
    creator: {
      id: "creator-1",
      displayName: "Meta AI",
      verified: true,
    },
    pricing: [
      {
        id: "plan-1",
        name: "Pay per Use",
        type: "premium",
        price: 0.02,
        unit: "1k tokens",
        active: true
      }
    ],
    rating: 4.8,
    reviewCount: 234,
    downloadCount: 125000,
    featured: true,
    license: "commercial",
    createdAt: new Date()
  },
  {
    id: "2",
    name: "CLIP Vision Encoder",
    slug: "clip-vision-encoder",
    description: "Connects text and images in a single embedding space for powerful multimodal applications.",
    category: ModelCategory.CV,
    architecture: "Transformer",
    tags: ["multimodal", "embeddings", "zero-shot"],
    creator: {
      id: "creator-2",
      displayName: "OpenAI",
      verified: true,
    },
    pricing: [
      {
        id: "plan-2",
        name: "Free Tier",
        type: "free",
        price: 0,
        unit: "request",
        active: true
      }
    ],
    rating: 4.6,
    reviewCount: 156,
    downloadCount: 89000,
    featured: true,
    license: "open-source",
    createdAt: new Date()
  },
  {
    id: "3",
    name: "Whisper Large V3",
    slug: "whisper-large-v3",
    description: "State-of-the-art speech recognition model supporting 99 languages with high accuracy.",
    category: ModelCategory.AUDIO,
    architecture: "Transformer",
    tags: ["speech-to-text", "multilingual", "robust"],
    creator: {
      id: "creator-2",
      displayName: "OpenAI",
      verified: true,
    },
    pricing: [
      {
        id: "plan-3",
        name: "Freemium",
        type: "freemium",
        price: 0.006,
        unit: "minute",
        active: true
      }
    ],
    rating: 4.9,
    reviewCount: 89,
    downloadCount: 67000,
    featured: false,
    license: "open-source",
    createdAt: new Date()
  }
]

const categories = [
  { value: "all", label: "All Categories" },
  { value: "nlp", label: "Natural Language Processing" },
  { value: "computer-vision", label: "Computer Vision" },
  { value: "audio", label: "Audio Processing" },
  { value: "multimodal", label: "Multimodal" },
  { value: "reinforcement-learning", label: "Reinforcement Learning" }
]

const sortOptions = [
  { value: "popularity", label: "Most Popular" },
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Highest Rated" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" }
]

const pricingFilters = [
  { value: "all", label: "All Pricing" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "freemium", label: "Freemium" }
]

export default function ModelsPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get("category") || "all")
  const [selectedSort, setSelectedSort] = useState(searchParams?.get("sort") || "popularity")
  const [selectedPricing, setSelectedPricing] = useState(searchParams?.get("pricing") || "all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<ModelFilters>({
    sortBy: 'popularity'
  })
  const [models, setModels] = useState(mockModels)

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchTerm, 300)

  // Fetch real models
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true)
      try {
        // You can call your sync API to get fresh models
        // const response = await fetch('/api/models/sync', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ source: 'all' })
        // })
        // const data = await response.json()
        
        // For now, keep using mock data but this is where you'd use real data
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching models:', error)
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [])

  // Filter and search logic
  useEffect(() => {
    let filteredModels = [...mockModels]

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filteredModels = filteredModels.filter((model: SimpleModel) =>
        model.name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.creator.displayName.toLowerCase().includes(query) ||
        model.tags.some((tag: string) => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filteredModels = filteredModels.filter((model: SimpleModel) => model.category === selectedCategory)
    }

    // Apply pricing filter
    if (selectedPricing !== "all") {
      if (selectedPricing === "free") {
        filteredModels = filteredModels.filter((model: SimpleModel) => model.pricing.some((plan: any) => plan.type === "free"))
      } else if (selectedPricing === "paid") {
        filteredModels = filteredModels.filter((model: SimpleModel) => model.pricing.some((plan: any) => plan.type === "premium" && !plan.active))
      } else if (selectedPricing === "freemium") {
        filteredModels = filteredModels.filter((model: SimpleModel) => model.pricing.some((plan: any) => plan.type === "freemium" && plan.active))
      }
    }

    // Advanced filters
    if (filters.licenses?.length) {
      filteredModels = filteredModels.filter((model: SimpleModel) => filters.licenses!.includes(model.license as any))
    }

    if (filters.architectures?.length) {
      filteredModels = filteredModels.filter((model: SimpleModel) => filters.architectures!.includes(model.architecture as any))
    }

    if (filters.minRating) {
      filteredModels = filteredModels.filter((model: SimpleModel) => model.rating >= filters.minRating!)
    }

    // Apply sorting
    switch (selectedSort) {
      case "rating":
        filteredModels.sort((a, b) => b.rating - a.rating)
        break
      case "downloads":
        filteredModels.sort((a, b) => b.downloadCount - a.downloadCount)
        break
      case "recent":
        filteredModels.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case "price-low":
        filteredModels.sort((a, b) => {
          const aPrice = Math.min(...a.pricing.map((p: any) => p.price))
          const bPrice = Math.min(...b.pricing.map((p: any) => p.price))
          return aPrice - bPrice
        })
        break
      case "price-high":
        filteredModels.sort((a, b) => {
          const aPrice = Math.max(...a.pricing.map((p: any) => p.price))
          const bPrice = Math.max(...b.pricing.map((p: any) => p.price))
          return bPrice - aPrice
        })
        break
      default: // popularity
        filteredModels.sort((a, b) => b.downloadCount - a.downloadCount)
    }

    setModels(filteredModels)
  }, [debouncedSearchQuery, selectedCategory, selectedSort, selectedPricing, filters])

  // Active filters for display
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; value: string; label: string }> = []
    
    if (selectedCategory !== "all") {
      const category = MODEL_CATEGORIES.find((c: any) => c.id === selectedCategory)
      if (category) {
        active.push({ key: 'category', value: selectedCategory, label: category.name })
      }
    }

    filters.licenses?.forEach((license: any) => {
      active.push({ key: 'license', value: license, label: license })
    })

    if (filters.pricing && typeof filters.pricing === 'string') {
      active.push({ key: 'pricing', value: filters.pricing, label: filters.pricing })
    }

    filters.architectures?.forEach((arch: any) => {
      active.push({ key: 'architecture', value: arch, label: arch })
    })

    if (filters.minRating) {
      active.push({ key: 'minRating', value: filters.minRating.toString(), label: `${filters.minRating}+ stars` })
    }

    return active
  }, [selectedCategory, filters])

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ModelFilters>) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters }))
  }

  const removeFilter = (key: string, value?: string) => {
    if (key === 'category') {
      setSelectedCategory("all")
    } else if (key === 'minRating') {
      setFilters((prev: any) => ({ ...prev, minRating: undefined }))
    } else {
      setFilters((prev: any) => {
        const filterValue = prev[key as keyof ModelFilters];
        if (Array.isArray(filterValue)) {
          return {
            ...prev,
            [key]: filterValue.filter((v: any) => v !== value)
          };
        }
        return prev;
      })
    }
  }

  const clearAllFilters = () => {
    setSelectedCategory("all")
    setFilters({ sortBy: 'popularity' })
    setSearchTerm("")
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const ModelCard = ({ model }: { model: SimpleModel }) => (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="capitalize">
            {model.category.replace("-", " ")}
          </Badge>
          <div className="flex gap-1">
            {model.pricing.some((plan: any) => plan.type === "free") && (
              <Badge variant="outline" className="text-xs">Free Tier</Badge>
            )}
            {model.featured && (
              <Badge variant="default" className="text-xs">Featured</Badge>
            )}
            {model.creator.verified && (
              <Badge variant="destructive" className="text-xs">✓ Verified</Badge>
            )}
          </div>
        </div>
        <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
          {model.name}
        </CardTitle>
        <CardDescription className="text-sm">
          by {model.creator.displayName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {model.description}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {model.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {model.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{model.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{model.rating}</span>
              <span className="text-muted-foreground">({formatNumber(model.reviewCount)})</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>{formatNumber(model.downloadCount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/models/${model.slug}`} className="text-muted-foreground">
              View Details
            </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="font-medium text-primary">{model.pricing.find((p: any) => p.active)?.name || "Contact for Pricing"}</span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-6 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">AI Model Marketplace</h1>
            <p className="text-muted-foreground mt-2">
              Discover and integrate cutting-edge AI models from top creators worldwide
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models, creators, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Pricing" />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingFilters.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {models.length} of {mockModels.length} models
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {models.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No models found</h3>
                <p>Try adjusting your search criteria or filters</p>
              </div>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {models.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {models.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" disabled={isLoading}>
              {isLoading ? "Loading..." : "Load More Models"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
