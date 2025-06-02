"use client"

import { FiltersSidebar } from "./filters-sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"
import { ModelFilters } from "@/lib/types"
import { useMediaQuery } from "@/hooks/use-media-query"

interface FiltersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: ModelFilters
  onFiltersChange: (filters: Partial<ModelFilters>) => void
  activeFiltersCount: number
}

export function FiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  activeFiltersCount,
}: FiltersModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const triggerContent = (
    <Button variant="outline" className="w-full sm:w-auto">
      <Filter className="h-4 w-4 mr-2" />
      Filters
      {activeFiltersCount > 0 && (
        <Badge variant="secondary" className="ml-2">
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Filter Models</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <FiltersSidebar filters={filters} onFiltersChange={onFiltersChange} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center justify-between">
            <span>Filter Models</span>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 overflow-y-auto flex-1">
          <FiltersSidebar filters={filters} onFiltersChange={onFiltersChange} />
        </div>
        <DrawerFooter>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onFiltersChange({
                  categories: [],
                  license: [],
                  pricing: [],
                  architecture: [],
                  tasks: [],
                  minRating: undefined,
                  maxPrice: undefined
                })
              }}
            >
              Clear All
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1">
                Apply Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
