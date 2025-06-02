"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Grid, List, SlidersHorizontal, X, ArrowUpDown, TrendingUp } from "lucide-react"
import { ModelCard } from "@/components/models/model-card"
import { ModelListItem } from "@/components/models/model-list-item"
import { FiltersSidebar } from "@/components/models/filters-sidebar"
import { FiltersModal } from "@/components/models/filters-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { MODEL_CATEGORIES, SORT_OPTIONS } from "@/lib/constants"
import { ModelFilters, Model, ModelCategory } from "@/lib/types"

// Mock data - replace with API calls
const mockModels: Model[] = [
  {
    id: "1",
    name: "LLaMA 2 70B Chat",
    slug: "llama-2-70b-chat",
    description: "A large language model fine-tuned for conversational use cases with exceptional reasoning capabilities.",
    longDescription: "LLaMA 2-Chat is a collection of fine-tuned large language models (LLMs) ranging in scale from 7B to 70B parameters. This is the 70B parameter version optimized for dialogue use cases.",
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
    category: "nlp" as ModelCategory,
    architecture: "LLaMA",
    tasks: ["text-generation", "conversation", "reasoning"],
    modelSize: "70B parameters",
    contextLength: "4096 tokens",
    inputModalities: ["text"],
    outputModalities: ["text"],
    benchmarks: [
      { name: "MMLU", dataset: "MMLU", metric: "accuracy", value: 68.9 },
      { name: "HumanEval", dataset: "HumanEval", metric: "pass@1", value: 29.9 }
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
    category: "computer-vision" as ModelCategory,
    architecture: "Transformer",
    tasks: ["image-classification", "image-to-text", "zero-shot-classification"],
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
        features: ["1000 requests/month", "Community Support"],
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
  },
  {
    id: "3",
    name: "Whisper Large V3",
    slug: "whisper-large-v3",
    description: "State-of-the-art speech recognition model supporting 99 languages with high accuracy.",
    longDescription: "Whisper is a general-purpose speech recognition model trained on a large dataset of diverse audio.",
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
    category: "audio" as ModelCategory,
    architecture: "Transformer",
    tasks: ["automatic-speech-recognition", "transcription"],
    modelSize: "1.5B parameters",
    inputModalities: ["audio"],
    outputModalities: ["text"],
    benchmarks: [
      { name: "Common Voice", dataset: "Common Voice", metric: "WER", value: 12.3 }
    ],
    averageLatency: 200,
    license: "open-source",
    version: "3.0.0",
    versions: [],
    tags: ["speech-to-text", "multilingual", "robust"],
    pricing: [
      {
        id: "plan-3",
        modelId: "3",
        name: "Freemium",
        type: "freemium",
        price: 0.006,
        unit: "minute",
        features: ["100 minutes free/month", "Premium features"],
        supportLevel: "standard",
        active: true
      }
    ],
    rating: 4.9,
    reviewCount: 89,
    downloadCount: 67000,
    apiCallCount: 450000,
    status: "published",
    featured: false,
    modelFiles: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function ModelsPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<ModelFilters>({
    sortBy: 'relevance'
  })
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

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
  const filteredModels = useMemo(() => {
    let filtered = [...mockModels]

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(model => model.category === selectedCategory)
    }

    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.creator.displayName.toLowerCase().includes(query) ||
        model.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Advanced filters
    if (filters.license?.length) {
      filtered = filtered.filter(model => filters.license!.includes(model.license))
    }

    if (filters.pricing?.length) {
      filtered = filtered.filter(model => {
        const hasPricingType = model.pricing.some(plan => 
          filters.pricing!.includes(plan.type as any)
        )
        return hasPricingType
      })
    }

    if (filters.architecture?.length) {
      filtered = filtered.filter(model => filters.architecture!.includes(model.architecture))
    }

    if (filters.minRating) {
      filtered = filtered.filter(model => model.rating >= filters.minRating!)
    }

    // Sorting
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'downloads':
        filtered.sort((a, b) => b.downloadCount - a.downloadCount)
        break
      case 'recent':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case 'price-low':
        filtered.sort((a, b) => {
          const aPrice = Math.min(...a.pricing.map(p => p.price))
          const bPrice = Math.min(...b.pricing.map(p => p.price))
          return aPrice - bPrice
        })
        break
      case 'price-high':
        filtered.sort((a, b) => {
          const aPrice = Math.max(...a.pricing.map(p => p.price))
          const bPrice = Math.max(...b.pricing.map(p => p.price))
          return bPrice - aPrice
        })
        break
      default:
        // Relevance - keep current order or implement search relevance scoring
        break
    }

    return filtered
  }, [debouncedSearchQuery, selectedCategory, filters])

  // Active filters for display
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; value: string; label: string }> = []
    
    if (selectedCategory !== "all") {
      const category = MODEL_CATEGORIES.find(c => c.id === selectedCategory)
      if (category) {
        active.push({ key: 'category', value: selectedCategory, label: category.name })
      }
    }

    filters.license?.forEach(license => {
      active.push({ key: 'license', value: license, label: license })
    })

    filters.pricing?.forEach(pricing => {
      active.push({ key: 'pricing', value: pricing, label: pricing })
    })

    filters.architecture?.forEach(arch => {
      active.push({ key: 'architecture', value: arch, label: arch })
    })

    if (filters.minRating) {
      active.push({ key: 'minRating', value: filters.minRating.toString(), label: `${filters.minRating}+ stars` })
    }

    return active
  }, [selectedCategory, filters])

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ModelFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const removeFilter = (key: string, value?: string) => {
    if (key === 'category') {
      setSelectedCategory("all")
    } else if (key === 'minRating') {
      setFilters(prev => ({ ...prev, minRating: undefined }))
    } else {
      setFilters(prev => {
        const filterValue = prev[key as keyof ModelFilters];
        if (Array.isArray(filterValue)) {
          return {
            ...prev,
            [key]: filterValue.filter(v => v !== value)
          };
        }
        return prev;
      })
    }
  }

  const clearAllFilters = () => {
    setSelectedCategory("all")
    setFilters({ sortBy: 'relevance' })
    setSearchQuery("")
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">AI Model Marketplace</h1>
        <p className="text-xl text-muted-foreground">
          Discover and integrate cutting-edge AI models from leading researchers and companies
        </p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search models, creators, or capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MODEL_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile Filters Button */}
            <Button
              variant="outline"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="sm:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>

            {/* Desktop Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden sm:flex"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort */}
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange({ sortBy: value as any })}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.key}-${filter.value}`}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter(filter.key, filter.value)}
              >
                {filter.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <div className="hidden lg:block w-80 shrink-0">
            <FiltersSidebar filters={filters} onFiltersChange={handleFilterChange} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">
                {filteredModels.length} {filteredModels.length === 1 ? 'Model' : 'Models'}
              </h2>
              {debouncedSearchQuery && (
                <p className="text-muted-foreground">
                  Results for "{debouncedSearchQuery}"
                </p>
              )}
            </div>
            
            {filteredModels.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Updated in real-time</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Models Grid/List */}
          {!isLoading && filteredModels.length > 0 && (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredModels.map((model) => (
                viewMode === "grid" ? (
                  <ModelCard key={model.id} model={model} />
                ) : (
                  <ModelListItem key={model.id} model={model} />
                )
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredModels.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No models found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button onClick={clearAllFilters}>Clear all filters</Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination would go here */}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <FiltersModal
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        filters={filters}
        onFiltersChange={handleFilterChange}
        activeFiltersCount={activeFilters.length}
      />
    </div>
  )
}
