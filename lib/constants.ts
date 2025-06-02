import { ModelCategory, License } from './types'

// Model Categories with metadata
export const MODEL_CATEGORIES = [
  {
    id: 'nlp' as ModelCategory,
    name: 'Natural Language Processing',
    description: 'Models for text understanding, generation, and manipulation',
    icon: '💬',
    examples: ['GPT-4', 'LLaMA 2', 'BERT', 'T5']
  },
  {
    id: 'computer-vision' as ModelCategory,
    name: 'Computer Vision',
    description: 'Models for image and video understanding',
    icon: '👁️',
    examples: ['CLIP', 'YOLO', 'ResNet', 'Stable Diffusion']
  },
  {
    id: 'audio' as ModelCategory,
    name: 'Audio Processing',
    description: 'Models for speech, music, and audio analysis',
    icon: '🎵',
    examples: ['Whisper', 'Wav2Vec', 'MusicGen', 'WavLM']
  },
  {
    id: 'multimodal' as ModelCategory,
    name: 'Multimodal',
    description: 'Models that process multiple types of data',
    icon: '🔗',
    examples: ['CLIP', 'DALLE', 'GPT-4V', 'Flamingo']
  },
  {
    id: 'reinforcement-learning' as ModelCategory,
    name: 'Reinforcement Learning',
    description: 'Models trained through interaction and reward',
    icon: '🎮',
    examples: ['AlphaGo', 'PPO', 'DQN', 'SAC']
  },
  {
    id: 'time-series' as ModelCategory,
    name: 'Time Series',
    description: 'Models for temporal data and forecasting',
    icon: '📈',
    examples: ['Prophet', 'LSTM', 'Transformer', 'ARIMA']
  },
  {
    id: 'recommendation' as ModelCategory,
    name: 'Recommendation',
    description: 'Models for personalized recommendations',
    icon: '🎯',
    examples: ['Collaborative Filtering', 'Matrix Factorization', 'Neural CF']
  },
  {
    id: 'robotics' as ModelCategory,
    name: 'Robotics',
    description: 'Models for robotic control and perception',
    icon: '🤖',
    examples: ['RT-1', 'PaLM-E', 'BC-Z', 'IBC']
  },
  {
    id: 'other' as ModelCategory,
    name: 'Other',
    description: 'Specialized models not covered by other categories',
    icon: '⚡',
    examples: []
  }
] as const

// Model Architectures
export const MODEL_ARCHITECTURES = [
  'Transformer',
  'LLaMA',
  'Falcon',
  'GPT',
  'BERT',
  'T5',
  'Mistral',
  'PaLM',
  'Claude',
  'Gemini',
  'ResNet',
  'ConvNet',
  'Vision Transformer',
  'YOLO',
  'U-Net',
  'GAN',
  'VAE',
  'Diffusion',
  'LSTM',
  'GRU',
  'CNN',
  'RNN',
  'Custom'
] as const

// Common Tasks by Category
export const TASKS_BY_CATEGORY = {
  'nlp': [
    'text-generation',
    'text-classification',
    'sentiment-analysis',
    'named-entity-recognition',
    'question-answering',
    'summarization',
    'translation',
    'text-embedding',
    'conversation',
    'code-generation',
    'text-to-sql',
    'fill-mask'
  ],
  'computer-vision': [
    'image-classification',
    'object-detection',
    'image-segmentation',
    'face-recognition',
    'optical-character-recognition',
    'image-generation',
    'image-to-image',
    'image-to-text',
    'video-classification',
    'video-generation',
    'style-transfer',
    'super-resolution'
  ],
  'audio': [
    'automatic-speech-recognition',
    'text-to-speech',
    'audio-classification',
    'music-generation',
    'audio-to-audio',
    'voice-conversion',
    'sound-event-detection',
    'speaker-recognition',
    'audio-separation',
    'noise-reduction'
  ],
  'multimodal': [
    'visual-question-answering',
    'image-text-to-text',
    'document-question-answering',
    'text-to-image',
    'image-to-text',
    'video-text-to-text'
  ],
  'reinforcement-learning': [
    'robotics',
    'game-playing',
    'autonomous-driving',
    'resource-allocation',
    'trading',
    'control-systems'
  ],
  'time-series': [
    'forecasting',
    'anomaly-detection',
    'classification',
    'regression',
    'imputation'
  ],
  'recommendation': [
    'collaborative-filtering',
    'content-based',
    'hybrid',
    'session-based',
    'ranking'
  ],
  'robotics': [
    'manipulation',
    'navigation',
    'perception',
    'planning',
    'control'
  ],
  'other': []
} as const

// License Types
export const LICENSE_TYPES = [
  {
    id: 'open-source' as License,
    name: 'Open Source',
    description: 'Free to use, modify, and distribute',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  {
    id: 'commercial' as License,
    name: 'Commercial',
    description: 'Requires license for commercial use',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  {
    id: 'research-only' as License,
    name: 'Research Only',
    description: 'Limited to research and non-commercial use',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  {
    id: 'custom' as License,
    name: 'Custom',
    description: 'Custom licensing terms',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
] as const

// Pricing Constants
export const PRICING_UNITS = [
  '1k tokens',
  '1M tokens',
  'request',
  'hour',
  'day',
  'month',
  'image',
  'minute',
  'second',
  'API call'
] as const

// Platform Configuration
export const PLATFORM_CONFIG = {
  DEFAULT_REVENUE_SHARE: 20, // 20% platform fee
  MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
  SUPPORTED_MODEL_FORMATS: ['.pkl', '.pt', '.pth', '.onnx', '.h5', '.pb', '.tflite', '.bin'],
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_MODEL_NAME_LENGTH: 100,
  MIN_MODEL_NAME_LENGTH: 3,
  MAX_TAGS: 20,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 24,
    MAX_PAGE_SIZE: 100
  },
  RATE_LIMITS: {
    API_CALLS_PER_HOUR: 1000,
    SEARCHES_PER_MINUTE: 60,
    UPLOADS_PER_DAY: 10
  }
} as const

// Sort Options
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' }
] as const

// Featured Sections
export const FEATURED_SECTIONS = [
  { id: 'trending', name: 'Trending', icon: '📈' },
  { id: 'new', name: 'New Releases', icon: '✨' },
  { id: 'popular', name: 'Most Popular', icon: '🔥' },
  { id: 'staff-picks', name: 'Staff Picks', icon: '⭐' },
  { id: 'open-source', name: 'Open Source', icon: '🌟' }
] as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'File type is not supported.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  MODEL_CREATED: 'Model created successfully!',
  MODEL_UPDATED: 'Model updated successfully!',
  MODEL_DELETED: 'Model deleted successfully!',
  REVIEW_SUBMITTED: 'Review submitted successfully!',
  SUBSCRIPTION_CREATED: 'Subscription created successfully!',
  PAYMENT_COMPLETED: 'Payment completed successfully!',
  API_KEY_GENERATED: 'API key generated successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!'
} as const

// Helio Configuration
export const HELIO_CONFIG = {
  PRODUCTION_API: 'https://api.hel.io/v1',
  DEVELOPMENT_API: 'https://api.dev.hel.io/v1',
  WEBHOOK_EVENTS: ['CREATED', 'STARTED', 'RENEWED', 'ENDED'] as const,
  SUPPORTED_CURRENCIES: ['USDC', 'SOL', 'ETH'] as const
} as const 