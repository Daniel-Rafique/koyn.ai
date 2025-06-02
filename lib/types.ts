// Core Types for AI Model Marketplace

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  type: 'consumer' | 'creator' | 'enterprise'
  createdAt: Date
  updatedAt: Date
  
  // Consumer fields
  apiKeys?: APIKey[]
  subscriptions?: Subscription[]
  usageStats?: UsageStats
  
  // Creator fields
  creatorProfile?: CreatorProfile
  models?: Model[]
  earnings?: Earnings
}

export interface CreatorProfile {
  id: string
  userId: string
  displayName: string
  bio?: string
  avatar?: string
  website?: string
  github?: string
  twitter?: string
  linkedin?: string
  verified: boolean
  rating: number
  totalEarnings: number
  totalDownloads: number
  createdAt: Date
}

export interface Model {
  id: string
  name: string
  slug: string
  description: string
  longDescription?: string
  creatorId: string
  creator: CreatorProfile
  
  // Categorization
  category: ModelCategory
  subcategory?: string
  architecture: string // e.g., "LLaMA", "Falcon", "Transformer"
  tasks: string[] // e.g., ["text-generation", "summarization"]
  
  // Technical specs
  modelSize: string // e.g., "7B parameters"
  contextLength?: string // e.g., "4096 tokens"
  inputModalities: string[] // e.g., ["text", "image"]
  outputModalities: string[] // e.g., ["text"]
  
  // Performance
  benchmarks: Benchmark[]
  averageLatency: number // milliseconds
  
  // Metadata
  license: License
  version: string
  versions: ModelVersion[]
  tags: string[]
  
  // Pricing
  pricing: PricingPlan[]
  
  // Stats
  rating: number
  reviewCount: number
  downloadCount: number
  apiCallCount: number
  
  // Status
  status: 'draft' | 'published' | 'deprecated'
  featured: boolean
  
  // Files & deployment
  modelFiles: ModelFile[]
  apiEndpoint?: string
  dockerImage?: string
  
  // SEO
  seoTitle?: string
  seoDescription?: string
  openGraphImage?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface ModelVersion {
  id: string
  modelId: string
  version: string
  changelog: string
  releaseDate: Date
  isLatest: boolean
  deprecated: boolean
  downloadUrl?: string
  performance?: Benchmark[]
}

export interface ModelFile {
  id: string
  modelId: string
  fileName: string
  fileSize: number
  fileType: string
  downloadUrl: string
  checksum: string
}

export interface Benchmark {
  name: string
  dataset: string
  metric: string
  value: number
  unit?: string
  description?: string
}

export interface PricingPlan {
  id: string
  modelId: string
  name: string
  type: 'free' | 'freemium' | 'premium' | 'enterprise'
  price: number
  unit: string // e.g., "1k tokens", "hour", "month"
  
  // Limits
  requestsPerMonth?: number
  requestsPerMinute?: number
  maxBatchSize?: number
  
  // Features
  features: string[]
  supportLevel: 'community' | 'standard' | 'priority'
  
  // Stripe integration
  stripePriceId?: string
  
  active: boolean
}

export interface APIKey {
  id: string
  userId: string
  name: string
  key: string // hashed
  lastUsed?: Date
  rateLimit: number
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
}

export interface UsageStats {
  userId: string
  modelId?: string
  date: Date
  requestCount: number
  tokenCount: number
  cost: number
  responseTime: number
}

export interface Subscription {
  id: string
  userId: string
  modelId: string
  planId: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  stripeSubscriptionId?: string
  createdAt: Date
}

export interface Review {
  id: string
  modelId: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'avatar'>
  rating: number
  title: string
  content: string
  helpful: number
  reported: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Discussion {
  id: string
  modelId: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'avatar' | 'type'>
  title: string
  content: string
  type: 'question' | 'showcase' | 'issue' | 'feature-request'
  tags: string[]
  upvotes: number
  replies: DiscussionReply[]
  pinned: boolean
  solved: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DiscussionReply {
  id: string
  discussionId: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'avatar' | 'type'>
  content: string
  upvotes: number
  isAnswer: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  id: string
  userId: string
  modelId: string
  planId: string
  model: Pick<Model, 'id' | 'name' | 'creator'>
  plan: PricingPlan
  quantity: number
  addedAt: Date
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  tax: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: 'stripe' | 'helio' | 'crypto'
  stripePaymentIntentId?: string
  helioTransactionId?: string
  createdAt: Date
  completedAt?: Date
}

export interface OrderItem {
  id: string
  orderId: string
  modelId: string
  planId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Earnings {
  creatorId: string
  totalEarnings: number
  currentMonthEarnings: number
  pendingPayouts: number
  lifetimeEarnings: number
  revenueShare: number // percentage taken by platform
}

export interface PayoutRequest {
  id: string
  creatorId: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  method: 'stripe' | 'crypto' | 'bank_transfer'
  walletAddress?: string
  bankDetails?: string
  createdAt: Date
  processedAt?: Date
}

// Enums
export type ModelCategory = 
  | 'nlp'
  | 'computer-vision' 
  | 'audio'
  | 'multimodal'
  | 'reinforcement-learning'
  | 'time-series'
  | 'recommendation'
  | 'robotics'
  | 'other'

export type License = 
  | 'open-source'
  | 'commercial'
  | 'research-only'
  | 'custom'

// Search and filter types
export interface ModelFilters {
  categories?: ModelCategory[]
  license?: License[]
  pricing?: ('free' | 'freemium' | 'premium')[]
  architecture?: string[]
  minRating?: number
  maxPrice?: number
  tasks?: string[]
  sortBy?: 'relevance' | 'rating' | 'downloads' | 'recent' | 'price-low' | 'price-high'
}

export interface SearchResult {
  models: Model[]
  totalCount: number
  facets: {
    categories: { value: ModelCategory; count: number }[]
    licenses: { value: License; count: number }[]
    architectures: { value: string; count: number }[]
    tasks: { value: string; count: number }[]
    priceRanges: { min: number; max: number; count: number }[]
  }
}

// API Response types
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// Helio Integration Types
export interface HelioPayment {
  id: string
  modelId: string
  userId: string
  amount: number
  currency: string
  transactionSignature: string
  status: 'pending' | 'completed' | 'failed'
  paylinkId: string
  createdAt: Date
}

export interface HelioWebhookPayload {
  event: 'CREATED' | 'STARTED' | 'RENEWED' | 'ENDED'
  transactionObject: {
    id: string
    paylinkId: string
    meta: {
      transactionSignature: string
      amount: string
      senderPK: string
      recipientPK: string
      transactionStatus: string
      customerDetails: {
        email?: string
      }
    }
  }
} 