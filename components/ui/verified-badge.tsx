import { CheckCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
}

export function VerifiedBadge({ 
  className, 
  size = "md", 
  showTooltip = true 
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  }

  const icon = (
    <CheckCircle 
      className={cn(
        "text-blue-600 fill-blue-100 stroke-blue-600 flex-shrink-0",
        sizeClasses[size],
        className
      )} 
      strokeWidth={2}
    />
  )

  if (!showTooltip) {
    return icon
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center">
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Verified creator</p>
      </TooltipContent>
    </Tooltip>
  )
} 