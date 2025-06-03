export enum ModelCategory {
  NLP = 'nlp',
  CV = 'computer-vision',
  AUDIO = 'audio',
  RL = 'reinforcement-learning',
  MULTIMODAL = 'multimodal',
}

export enum ModelArchitecture {
  TRANSFORMER = 'transformer',
  LLAMA = 'llama',
  FALCON = 'falcon',
  CNN = 'cnn',
  RNN = 'rnn',
  GAN = 'gan',
  DIFFUSION = 'diffusion',
  VAE = 'vae',
  BERT = 'bert',
  GPT = 'gpt',
}

export enum LicenseType {
  MIT = 'mit',
  APACHE2 = 'apache-2.0',
  GPL3 = 'gpl-3.0',
  OPENRAIL = 'openrail',
  PROPRIETARY = 'proprietary',
  COMMERCIAL = 'commercial',
  CC_BY = 'cc-by',
  CC_BY_SA = 'cc-by-sa',
}

export enum PricingUnit {
  TOKENS = 'tokens',
  REQUESTS = 'requests',
  MINUTES = 'minutes',
  IMAGES = 'images',
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export enum UserRole {
  ADMIN = 'admin',
  CREATOR = 'creator',
  CONSUMER = 'consumer',
  MODERATOR = 'moderator',
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  totalEarnings?: number;
  followerCount?: number;
  followingCount?: number;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  user?: User;
  companyName?: string;
  description: string;
  specializations: ModelCategory[];
  website?: string;
  socialLinks: Record<string, string>;
  totalModels: number;
  totalDownloads: number;
  averageRating: number;
  verificationBadges: string[];
  payoutMethods: PayoutMethod[];
  createdAt: string;
  updatedAt: string;
}

export interface Model {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: ModelCategory;
  architecture: ModelArchitecture;
  license: LicenseType;
  tags: string[];
  imageUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  paperUrl?: string;
  
  // Creator info
  creatorId: string;
  creator?: CreatorProfile;
  
  // Metrics
  downloads: number;
  likes: number;
  views: number;
  averageRating: number;
  totalReviews: number;
  
  // Pricing
  pricingPlans: PricingPlan[];
  isFreeTier: boolean;
  
  // Technical details
  modelSize: string;
  versions: ModelVersion[];
  currentVersion: string;
  benchmarks: Benchmark[];
  supportedTasks: string[];
  languages?: string[];
  
  // Status
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Files
  modelFiles: ModelFile[];
  sampleFiles: ModelFile[];
}

export interface ModelVersion {
  id: string;
  modelId: string;
  version: string;
  changelog: string;
  releaseDate: string;
  isStable: boolean;
  downloadUrl?: string;
  size: number;
  checksum: string;
}

export interface ModelFile {
  id: string;
  modelId: string;
  filename: string;
  fileType: string;
  size: number;
  url: string;
  checksum: string;
  uploadedAt: string;
}

export interface PricingPlan {
  id: string;
  modelId: string;
  name: string;
  description: string;
  unit: PricingUnit;
  pricePerUnit: number;
  currency: string;
  monthlyLimit?: number;
  features: string[];
  isPopular: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  modelId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  usage: SubscriptionUsage;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: User;
  model?: Model;
  plan?: PricingPlan;
}

export interface SubscriptionUsage {
  tokens?: number;
  requests?: number;
  minutes?: number;
  images?: number;
  lastResetAt: string;
}

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  modelId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: User;
  model?: Model;
}

export interface Discussion {
  id: string;
  modelId: string;
  userId: string;
  title: string;
  content: string;
  replies: DiscussionReply[];
  upvotes: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: User;
  model?: Model;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  userId: string;
  content: string;
  upvotes: number;
  createdAt: string;
  
  // Relations
  user?: User;
}

export interface Benchmark {
  id: string;
  modelId: string;
  metric: string;
  value: number;
  unit: string;
  dataset: string;
  description?: string;
  sourceUrl?: string;
}

export interface CartItem {
  modelId: string;
  planId: string;
  model: Model;
  plan: PricingPlan;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  helioPaymentId?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  modelId: string;
  planId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Earnings {
  id: string;
  creatorId: string;
  modelId: string;
  amount: number;
  currency: string;
  orderId: string;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'paid' | 'held';
  createdAt: string;
  paidAt?: string;
}

export interface PayoutRequest {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  method: string;
  details: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
}

export interface PayoutMethod {
  id: string;
  creatorId: string;
  type: 'stripe' | 'paypal' | 'bank' | 'crypto';
  details: Record<string, any>;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

// Helio Payment Integration
export interface HelioPayment {
  id: string;
  userId: string;
  orderId: string;
  payLink: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'STARTED' | 'RENEWED' | 'ENDED' | 'FAILED';
  transactionId?: string;
  createdAt: string;
  expiresAt: string;
  metadata: Record<string, any>;
}

export interface HelioSubscription {
  id: string;
  userId: string;
  subscriptionId: string;
  helioSubscriptionId: string;
  payLink: string;
  status: 'CREATED' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  nextPaymentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Filter and Search Types
export interface ModelFilters {
  categories?: ModelCategory[];
  architectures?: ModelArchitecture[];
  licenses?: LicenseType[];
  pricing?: 'free' | 'paid' | 'both';
  minRating?: number;
  sortBy?: 'popularity' | 'rating' | 'recent' | 'downloads' | 'price';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
  };
}

export interface APIError extends Error {
  code: string;
  status: number;
  details?: any;
}

// Theme and UI Types
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  role: UserRole;
}

// Code Snippet Types
export interface CodeSnippet {
  language: 'javascript' | 'python' | 'curl' | 'bash';
  title: string;
  code: string;
  description?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

export interface ModelAnalytics {
  modelId: string;
  views: number;
  downloads: number;
  likes: number;
  apiCalls: number;
  revenue: number;
  period: 'day' | 'week' | 'month' | 'year';
  data: Array<{
    date: string;
    views: number;
    downloads: number;
    likes: number;
    apiCalls: number;
    revenue: number;
  }>;
} 