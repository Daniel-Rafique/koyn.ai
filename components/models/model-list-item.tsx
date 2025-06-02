"use client"

import { Star, Download, Zap, Clock, DollarSign, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { Model } from "@/lib/types"
import { LICENSE_TYPES } from "@/lib/constants"

interface ModelListItemProps {
  model: Model
}

export function ModelListItem({ model }: ModelListItemProps) {
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

  const licenseInfo = getLicenseInfo()
  const bestBenchmark = getBestBenchmark()

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar and Basic Info */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>{model.creator.displayName[0]}</AvatarFallback>
          </Avatar>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors truncate">{model.name}</h3>
                  {model.creator.verified && (
                    <VerifiedBadge showTooltip={false} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">by {model.creator.displayName}</p>
              </div>
              <Badge className={`${licenseInfo.color} flex-shrink-0`} variant="secondary">{licenseInfo.name}</Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{model.description}</p>

            {/* Tags */}
            <div className="tag-container mb-3">
              <Badge variant="secondary" className="tag-primary">
                {model.category}
              </Badge>
              <Badge variant="outline" className="tag-secondary">
                {model.architecture}
              </Badge>
              {model.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="tag-secondary">
                  {tag}
                </Badge>
              ))}
              {model.tags.length > 3 && (
                <Badge variant="outline" className="tag-overflow">
                  +{model.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{model.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>{model.downloadCount.toLocaleString()}</span>
                </div>
                {bestBenchmark && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>{bestBenchmark.value}{bestBenchmark.unit || '%'} {bestBenchmark.metric}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{model.averageLatency}ms</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getPricingDisplay()}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Try Now
                </Button>
                <Button size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
