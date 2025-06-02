"use client"

import { useState } from "react"
import { Check, ChevronDown, Star, DollarSign, Cpu, Scale, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { ModelFilters } from "@/lib/types"
import { MODEL_CATEGORIES, LICENSE_TYPES, MODEL_ARCHITECTURES, PRICING_UNITS } from "@/lib/constants"

interface FiltersSidebarProps {
  filters: ModelFilters
  onFiltersChange: (filters: Partial<ModelFilters>) => void
}

export function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    pricing: true,
    license: true,
    architecture: false,
    performance: false,
    features: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const categories = filters.categories || []
    if (checked) {
      onFiltersChange({ categories: [...categories, categoryId as any] })
    } else {
      onFiltersChange({ categories: categories.filter(c => c !== categoryId) })
    }
  }

  const handleLicenseChange = (licenseId: string, checked: boolean) => {
    const licenses = filters.license || []
    if (checked) {
      onFiltersChange({ license: [...licenses, licenseId as any] })
    } else {
      onFiltersChange({ license: licenses.filter(l => l !== licenseId) })
    }
  }

  const handlePricingTypeChange = (pricingType: string, checked: boolean) => {
    const pricing = filters.pricing || []
    if (checked) {
      onFiltersChange({ pricing: [...pricing, pricingType as any] })
    } else {
      onFiltersChange({ pricing: pricing.filter(p => p !== pricingType) })
    }
  }

  const handleArchitectureChange = (architecture: string, checked: boolean) => {
    const architectures = filters.architecture || []
    if (checked) {
      onFiltersChange({ architecture: [...architectures, architecture] })
    } else {
      onFiltersChange({ architecture: architectures.filter(a => a !== architecture) })
    }
  }

  const handleTaskChange = (task: string, checked: boolean) => {
    const tasks = filters.tasks || []
    if (checked) {
      onFiltersChange({ tasks: [...tasks, task] })
    } else {
      onFiltersChange({ tasks: tasks.filter(t => t !== task) })
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      license: [],
      pricing: [],
      architecture: [],
      tasks: [],
      minRating: undefined,
      maxPrice: undefined
    })
  }

  const activeFiltersCount = 
    (filters.categories?.length || 0) +
    (filters.license?.length || 0) +
    (filters.pricing?.length || 0) +
    (filters.architecture?.length || 0) +
    (filters.tasks?.length || 0) +
    (filters.minRating ? 1 : 0) +
    (filters.maxPrice ? 1 : 0)

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Categories */}
        <Collapsible
          open={openSections.categories}
          onOpenChange={() => toggleSection('categories')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4" />
                <span className="font-medium">Categories</span>
                {filters.categories?.length ? (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {filters.categories.length}
                  </Badge>
                ) : null}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.categories ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            {MODEL_CATEGORIES.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={filters.categories?.includes(category.id) || false}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="flex items-center space-x-2 cursor-pointer text-sm"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Pricing */}
        <Collapsible
          open={openSections.pricing}
          onOpenChange={() => toggleSection('pricing')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Pricing</span>
                {filters.pricing?.length ? (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {filters.pricing.length}
                  </Badge>
                ) : null}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.pricing ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            {[
              { id: 'free', label: 'Free', description: 'No cost to use' },
              { id: 'freemium', label: 'Freemium', description: 'Free tier with paid upgrades' },
              { id: 'premium', label: 'Premium', description: 'Paid models' },
              { id: 'enterprise', label: 'Enterprise', description: 'Custom pricing' }
            ].map((pricing) => (
              <div key={pricing.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`pricing-${pricing.id}`}
                  checked={filters.pricing?.includes(pricing.id as any) || false}
                  onCheckedChange={(checked) => handlePricingTypeChange(pricing.id, checked as boolean)}
                />
                <Label
                  htmlFor={`pricing-${pricing.id}`}
                  className="cursor-pointer text-sm"
                >
                  <div>
                    <div className="font-medium">{pricing.label}</div>
                    <div className="text-xs text-muted-foreground">{pricing.description}</div>
                  </div>
                </Label>
              </div>
            ))}

            {/* Max Price Slider */}
            <div className="pt-2">
              <Label className="text-sm font-medium">Max Price per 1k tokens</Label>
              <div className="mt-2">
                <Slider
                  value={[filters.maxPrice || 1]}
                  onValueChange={([value]) => onFiltersChange({ maxPrice: value })}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$0</span>
                  <span>${filters.maxPrice?.toFixed(2) || '1.00'}</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* License */}
        <Collapsible
          open={openSections.license}
          onOpenChange={() => toggleSection('license')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Scale className="h-4 w-4" />
                <span className="font-medium">License</span>
                {filters.license?.length ? (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {filters.license.length}
                  </Badge>
                ) : null}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.license ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            {LICENSE_TYPES.map((license) => (
              <div key={license.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`license-${license.id}`}
                  checked={filters.license?.includes(license.id) || false}
                  onCheckedChange={(checked) => handleLicenseChange(license.id, checked as boolean)}
                />
                <Label
                  htmlFor={`license-${license.id}`}
                  className="cursor-pointer text-sm"
                >
                  <div>
                    <div className="font-medium">{license.name}</div>
                    <div className="text-xs text-muted-foreground">{license.description}</div>
                  </div>
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Architecture */}
        <Collapsible
          open={openSections.architecture}
          onOpenChange={() => toggleSection('architecture')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4" />
                <span className="font-medium">Architecture</span>
                {filters.architecture?.length ? (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {filters.architecture.length}
                  </Badge>
                ) : null}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.architecture ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4 max-h-48 overflow-y-auto">
            {MODEL_ARCHITECTURES.map((architecture) => (
              <div key={architecture} className="flex items-center space-x-2">
                <Checkbox
                  id={`architecture-${architecture}`}
                  checked={filters.architecture?.includes(architecture) || false}
                  onCheckedChange={(checked) => handleArchitectureChange(architecture, checked as boolean)}
                />
                <Label
                  htmlFor={`architecture-${architecture}`}
                  className="cursor-pointer text-sm"
                >
                  {architecture}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Performance */}
        <Collapsible
          open={openSections.performance}
          onOpenChange={() => toggleSection('performance')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Performance</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.performance ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Minimum Rating */}
            <div>
              <Label className="text-sm font-medium flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>Minimum Rating</span>
              </Label>
              <RadioGroup
                value={filters.minRating?.toString() || ''}
                onValueChange={(value) => onFiltersChange({ minRating: value ? parseFloat(value) : undefined })}
                className="mt-2"
              >
                {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                    <Label htmlFor={`rating-${rating}`} className="flex items-center space-x-1 text-sm cursor-pointer">
                      <span>{rating}+</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(rating) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Common Tasks */}
        <Collapsible
          open={openSections.features}
          onOpenChange={() => toggleSection('features')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Common Tasks</span>
                {filters.tasks?.length ? (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {filters.tasks.length}
                  </Badge>
                ) : null}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.features ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4 max-h-48 overflow-y-auto">
            {[
              'text-generation',
              'image-classification',
              'speech-recognition',
              'translation',
              'summarization',
              'question-answering',
              'sentiment-analysis',
              'object-detection',
              'image-generation',
              'code-generation'
            ].map((task) => (
              <div key={task} className="flex items-center space-x-2">
                <Checkbox
                  id={`task-${task}`}
                  checked={filters.tasks?.includes(task) || false}
                  onCheckedChange={(checked) => handleTaskChange(task, checked as boolean)}
                />
                <Label
                  htmlFor={`task-${task}`}
                  className="cursor-pointer text-sm capitalize"
                >
                  {task.replace(/-/g, ' ')}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
