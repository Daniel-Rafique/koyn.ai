"use client"

import { Star, Users, Zap, ExternalLink, MapPin, Calendar } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CreatorCardProps {
  creator: {
    id: string
    name: string
    company?: string
    avatar: string
    bio: string
    location?: string
    joinedDate: string
    verified: boolean
    modelCount: number
    totalDownloads: number
    averageRating: number
    followers: number
    specialties: string[]
    featuredModels: string[]
    socialLinks?: {
      website?: string
      github?: string
      twitter?: string
      linkedin?: string
    }
  }
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
              <AvatarFallback>
                {creator.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {creator.verified && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
              {creator.name}
            </h3>
            {creator.company && <p className="text-sm text-muted-foreground truncate">{creator.company}</p>}
            <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
              {creator.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{creator.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Joined {creator.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{creator.bio}</p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-3">
          {creator.specialties.slice(0, 3).map((specialty) => (
            <Badge key={specialty} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {creator.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{creator.specialties.length - 3} more
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{creator.modelCount}</span>
              <span className="text-muted-foreground">models</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{creator.averageRating}</span>
              <span className="text-muted-foreground">avg rating</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{creator.followers.toLocaleString()}</span>
              <span className="text-muted-foreground">followers</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {creator.totalDownloads.toLocaleString()} total downloads
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex items-center justify-between">
        <div className="flex space-x-1">
          {creator.socialLinks?.website && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {creator.socialLinks?.github && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Follow
          </Button>
          <Button size="sm">View Profile</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
