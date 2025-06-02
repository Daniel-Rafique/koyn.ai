"use client"

import { Star, Download, Zap, Clock, DollarSign, Play, Heart, ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { Model } from "@/lib/types"
import { LICENSE_TYPES } from "@/lib/constants"
import Link from "next/link"
import { useState } from "react"

interface ModelCardProps {
  model: Model
}

export function ModelCard({ model }: ModelCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const getPricingDisplay = () => {
    const freePlan = model.pricing.find(p => p.type === 'free')
    const cheapestPlan = model.pricing.reduce((min, plan) => 
      plan.price < min.price ? plan : min
    )

    if (freePlan) return "Free"
    if (model.pricing.some(p => p.type === 'freemium')) return "Freemium"
    return `$${cheapestPlan.price}/${cheapestPlan.unit}`
  }

  const getLicenseInfo = () => {
    return LICENSE_TYPES.find(l => l.id === model.license) || LICENSE_TYPES[0]
  }

  const getBestBenchmark = () => {
    if (model.benchmarks.length === 0) return null
    return model.benchmarks.reduce((best, current) => 
      current.value > best.value ? current : best
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const licenseInfo = getLicenseInfo()
  const bestBenchmark = getBestBenchmark()

  return (
    <TooltipProvider>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
        <CardHeader className="pb-4">
          {/* Top row: Featured and License badges */}
          <div className="flex items-center justify-end gap-2 mb-3">
            {model.featured && (
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            )}
            <Badge variant="secondary" className={`text-xs ${licenseInfo.color}`}>
              {licenseInfo.name}
            </Badge>
          </div>
          
          {/* Main row: Avatar, title, and verified badge */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={model.creator.avatar || "/placeholder.svg"} />
              <AvatarFallback>{model.creator.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {model.name}
                </h3>
                {model.creator.verified && (
                  <VerifiedBadge />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                by {model.creator.displayName}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 flex-1">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {model.description}
          </p>

          <div className="tag-container mb-4">
            <Badge variant="secondary" className="tag-primary">
              {model.category}
            </Badge>
            <Badge variant="outline" className="tag-secondary">
              {model.architecture}
            </Badge>
            {model.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="tag-secondary">
                {tag}
              </Badge>
            ))}
            {model.tags.length > 2 && (
              <Badge variant="outline" className="tag-overflow">
                +{model.tags.length - 2}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{model.rating}</span>
              <span className="text-muted-foreground">({formatNumber(model.reviewCount)})</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>{formatNumber(model.downloadCount)}</span>
            </div>
            {bestBenchmark && (
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <Tooltip>
                  <TooltipTrigger>
                    <span>{bestBenchmark.value}{bestBenchmark.unit || '%'}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{bestBenchmark.name} on {bestBenchmark.dataset}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{model.averageLatency}ms</span>
            </div>
          </div>

          {/* Model Size & Context */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Size:</span> {model.modelSize}
              </div>
              {model.contextLength && (
                <div>
                  <span className="font-medium">Context:</span> {model.contextLength}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{getPricingDisplay()}</span>
          </div>
          <div className="flex items-center space-x-1">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                setIsLiked(!isLiked)
              }}
              className="h-8 w-8 p-0"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </Button>
            
            {/* Try Button */}
            <Button variant="outline" size="sm" className="text-xs px-2">
              <Play className="h-3 w-3 mr-1" />
              Try
            </Button>
            
            {/* View Details Button */}
            <Button size="sm" asChild className="text-xs px-2">
              <Link href={`/models/${model.slug}`}>
                View
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
