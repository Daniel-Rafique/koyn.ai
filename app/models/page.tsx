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

// Database model interface
interface DatabaseModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
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
    type: string;
    price: number;
    unit: string;
    active: boolean;
  }>;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  featured: boolean;
  license: string;
  createdAt: string;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "NLP", label: "Natural Language Processing" },
  { value: "COMPUTER_VISION", label: "Computer Vision" },
  { value: "AUDIO", label: "Audio Processing" },
  { value: "MULTIMODAL", label: "Multimodal" },
  { value: "REINFORCEMENT_LEARNING", label: "Reinforcement Learning" }
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
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ModelFilters>({
    sortBy: 'popularity'
  })
  const [models, setModels] = useState<DatabaseModel[]>([])
  const [totalModels, setTotalModels] = useState(0)

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchTerm, 300)

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearchQuery) params.set('search', debouncedSearchQuery)
        if (selectedCategory !== 'all') params.set('category', selectedCategory)
        if (selectedSort) params.set('sort', selectedSort)
        if (selectedPricing !== 'all') params.set('pricing', selectedPricing)
        
        const response = await fetch(`/api/models?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setModels(data.data.models || [])
          setTotalModels(data.data.pagination.total || 0)
        } else {
          console.error('Failed to fetch models')
        }
      } catch (error) {
        console.error('Error fetching models:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [debouncedSearchQuery, selectedCategory, selectedSort, selectedPricing])

  // Active filters for display
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; value: string; label: string }> = []
    
    if (selectedCategory !== "all") {
      const category = categories.find((c: any) => c.value === selectedCategory)
      if (category) {
        active.push({ key: 'category', value: selectedCategory, label: category.label })
      }
    }

    if (selectedPricing !== "all") {
      active.push({ key: 'pricing', value: selectedPricing, label: selectedPricing })
    }

    return active
  }, [selectedCategory, selectedPricing])

  // Handle filter changes
  const removeFilter = (key: string, value?: string) => {
    if (key === 'category') {
      setSelectedCategory("all")
    } else if (key === 'pricing') {
      setSelectedPricing("all")
    }
  }

  const clearAllFilters = () => {
    setSelectedCategory("all")
    setSelectedPricing("all")
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

  const ModelCard = ({ model }: { model: DatabaseModel }) => (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="capitalize">
            {model.category.replace("_", " ").toLowerCase()}
          </Badge>
          <div className="flex gap-1">
            {model.pricing.some((plan: any) => plan.type === "FREE") && (
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
          <span className="font-medium text-primary">
            {model.pricing.find((p: any) => p.active)?.name || "Contact for Pricing"}
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="space-y-6 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">AI Model Marketplace</h1>
              <p className="text-muted-foreground mt-2">
                Discover and integrate cutting-edge AI models from top creators worldwide
              </p>
            </div>
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

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
                Showing {models.length} of {totalModels} models
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
