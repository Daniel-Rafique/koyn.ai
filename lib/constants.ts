import { ModelCategory, LicenseType, ModelArchitecture, PricingUnit } from "./types"

// Model Categories with Icons and Examples
export const MODEL_CATEGORIES = [
  {
    id: ModelCategory.NLP,
    name: "Natural Language Processing",
    icon: "🧠",
    description: "Language models, text generation, translation, and understanding",
    examples: ["GPT-4", "BERT", "T5", "ChatGPT"]
  },
  {
    id: ModelCategory.CV,
    name: "Computer Vision", 
    icon: "👁️",
    description: "Image recognition, generation, and processing models",
    examples: ["DALL-E", "Stable Diffusion", "YOLO", "ResNet"]
  },
  {
    id: ModelCategory.AUDIO,
    name: "Audio Processing",
    icon: "🎵", 
    description: "Speech recognition, text-to-speech, and audio generation",
    examples: ["Whisper", "Eleven Labs", "WaveNet", "Tacotron"]
  },
  {
    id: ModelCategory.RL,
    name: "Reinforcement Learning",
    icon: "🎮",
    description: "Game AI, decision making, and control systems",
    examples: ["AlphaGo", "OpenAI Five", "MuZero", "PPO"]
  },
  {
    id: ModelCategory.MULTIMODAL,
    name: "Multimodal",
    icon: "🔄",
    description: "Models that work with multiple data types (text, image, audio)",
    examples: ["GPT-4V", "CLIP", "DALL-E 2", "Flamingo"]
  }
] as const

// Model Architectures
export const MODEL_ARCHITECTURES = [
  { id: ModelArchitecture.TRANSFORMER, name: "Transformer", description: "Attention-based neural network architecture" },
  { id: ModelArchitecture.LLAMA, name: "LLaMA", description: "Meta's Large Language Model architecture" },
  { id: ModelArchitecture.FALCON, name: "Falcon", description: "Open-source language model by TII" },
  { id: ModelArchitecture.CNN, name: "Convolutional Neural Network", description: "Deep learning for image processing" },
  { id: ModelArchitecture.RNN, name: "Recurrent Neural Network", description: "Sequential data processing" },
  { id: ModelArchitecture.GAN, name: "Generative Adversarial Network", description: "Generative model training" },
  { id: ModelArchitecture.DIFFUSION, name: "Diffusion Model", description: "Progressive noise removal for generation" },
  { id: ModelArchitecture.VAE, name: "Variational Autoencoder", description: "Probabilistic generative model" },
  { id: ModelArchitecture.BERT, name: "BERT", description: "Bidirectional Encoder Representations" },
  { id: ModelArchitecture.GPT, name: "GPT", description: "Generative Pre-trained Transformer" }
] as const

// License Types with Colors
export const LICENSE_TYPES = [
  { id: LicenseType.MIT, name: "MIT", color: "green", description: "Permissive open source license" },
  { id: LicenseType.APACHE2, name: "Apache 2.0", color: "blue", description: "Permissive license with patent protection" },
  { id: LicenseType.GPL3, name: "GPL 3.0", color: "orange", description: "Copyleft open source license" },
  { id: LicenseType.OPENRAIL, name: "OpenRAIL", color: "purple", description: "Responsible AI license" },
  { id: LicenseType.PROPRIETARY, name: "Proprietary", color: "red", description: "Closed source, commercial use" },
  { id: LicenseType.COMMERCIAL, name: "Commercial", color: "yellow", description: "Commercial use allowed" },
  { id: LicenseType.CC_BY, name: "CC BY", color: "teal", description: "Creative Commons Attribution" },
  { id: LicenseType.CC_BY_SA, name: "CC BY-SA", color: "indigo", description: "Creative Commons ShareAlike" }
] as const

// Pricing Units
export const PRICING_UNITS = [
  { id: PricingUnit.TOKENS, name: "Tokens", description: "Per 1,000 tokens processed" },
  { id: PricingUnit.REQUESTS, name: "Requests", description: "Per API request made" },
  { id: PricingUnit.MINUTES, name: "Minutes", description: "Per minute of audio processed" },
  { id: PricingUnit.IMAGES, name: "Images", description: "Per image generated or processed" },
  { id: PricingUnit.MONTHLY, name: "Monthly", description: "Monthly subscription fee" },
  { id: PricingUnit.ANNUAL, name: "Annual", description: "Annual subscription fee" }
] as const

// Platform Configuration
export const PLATFORM_CONFIG = {
  // Revenue sharing
  CREATOR_REVENUE_SHARE: 0.7, // 70% to creator, 30% to platform
  PLATFORM_FEE: 0.3,
  
  // File upload limits
  MAX_MODEL_FILE_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
  MAX_SAMPLE_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: [
    '.pkl', '.pt', '.pth', '.safetensors', '.bin', '.h5', '.pb', 
    '.onnx', '.tflite', '.json', '.yaml', '.yml', '.txt', '.md',
    '.zip', '.tar.gz', '.tar'
  ],
  
  // Rate limits
  FREE_TIER_REQUESTS_PER_MINUTE: 10,
  PREMIUM_TIER_REQUESTS_PER_MINUTE: 1000,
  MAX_CONCURRENT_REQUESTS: 5,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Search
  SEARCH_RESULTS_LIMIT: 1000,
  SEARCH_DEBOUNCE_MS: 300,
  
  // Verification requirements
  CREATOR_VERIFICATION_REQUIREMENTS: {
    MIN_MODELS: 3,
    MIN_DOWNLOADS: 1000,
    MIN_RATING: 4.0,
    IDENTITY_VERIFICATION: true
  }
} as const

// Sort Options for Model Listings
export const SORT_OPTIONS = [
  { value: "popularity", label: "Most Popular", description: "Based on downloads and usage" },
  { value: "rating", label: "Highest Rated", description: "Based on user reviews" },
  { value: "recent", label: "Recently Added", description: "Newest models first" },
  { value: "downloads", label: "Most Downloaded", description: "Download count" },
  { value: "price-low", label: "Price: Low to High", description: "Cheapest first" },
  { value: "price-high", label: "Price: High to Low", description: "Most expensive first" },
  { value: "alphabetical", label: "A-Z", description: "Alphabetical order" }
] as const

// Status Messages
export const STATUS_MESSAGES = {
  SUCCESS: {
    MODEL_UPLOADED: "Model uploaded successfully!",
    PROFILE_UPDATED: "Profile updated successfully!",
    SUBSCRIPTION_CREATED: "Subscription created successfully!",
    PAYMENT_COMPLETED: "Payment completed successfully!",
    REVIEW_SUBMITTED: "Review submitted successfully!"
  },
  ERROR: {
    MODEL_UPLOAD_FAILED: "Failed to upload model. Please try again.",
    PAYMENT_FAILED: "Payment failed. Please check your payment details.",
    SUBSCRIPTION_FAILED: "Failed to create subscription. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    UNAUTHORIZED: "You need to sign in to perform this action.",
    FORBIDDEN: "You don't have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    SERVER_ERROR: "Internal server error. Please try again later."
  },
  WARNING: {
    UNSAVED_CHANGES: "You have unsaved changes. Are you sure you want to leave?",
    DELETE_CONFIRMATION: "This action cannot be undone. Are you sure?",
    QUOTA_EXCEEDED: "You've exceeded your quota. Please upgrade your plan.",
    MAINTENANCE_MODE: "The platform is under maintenance. Some features may be unavailable."
  }
} as const

// Helio Payment Configuration
export const HELIO_CONFIG = {
  API_BASE_URL: process.env.HELIO_API_URL || "https://api.hel.io",
  WEBHOOK_SECRET: process.env.HELIO_WEBHOOK_SECRET,
  SUPPORTED_CURRENCIES: ["SOL", "USDC", "ETH", "BTC", "MATIC", "AVAX"],
  DEFAULT_CURRENCY: "USDC",
  PAYMENT_EXPIRY_MINUTES: 30,
  SUBSCRIPTION_RENEWAL_BUFFER_HOURS: 24
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  CRYPTO_PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_CRYPTO_PAYMENTS === "true",
  MODEL_FINE_TUNING: process.env.NEXT_PUBLIC_ENABLE_FINE_TUNING === "true",
  SOCIAL_FEATURES: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_FEATURES === "true",
  ADVANCED_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS === "true",
  API_PLAYGROUND: process.env.NEXT_PUBLIC_ENABLE_API_PLAYGROUND === "true",
  COMMUNITY_FEATURES: process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_FEATURES === "true"
} as const

// API Endpoints
export const API_ENDPOINTS = {
  MODELS: "/api/models",
  CREATORS: "/api/creators", 
  SUBSCRIPTIONS: "/api/subscriptions",
  PAYMENTS: "/api/payments",
  ANALYTICS: "/api/analytics",
  SEARCH: "/api/search",
  UPLOAD: "/api/upload",
  WEBHOOKS: {
    HELIO: "/api/webhooks/helio",
    STRIPE: "/api/webhooks/stripe"
  }
} as const

// External Service URLs
export const EXTERNAL_SERVICES = {
  HUGGING_FACE: "https://huggingface.co",
  REPLICATE: "https://replicate.com",
  GITHUB: "https://github.com",
  DISCORD: "https://discord.gg/koynai",
  TWITTER: "https://twitter.com/koynai",
  DOCS: "https://docs.koyn.ai",
  SUPPORT: "https://support.koyn.ai"
} as const 