import { z } from 'zod'

// Common validation patterns
export const validationPatterns = {
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  uuid: z.string().uuid('Invalid ID format'),
  url: z.string().url('Invalid URL format'),
  mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  creditCard: z.string().regex(/^\d{13,19}$/, 'Invalid credit card number'),
  ipAddress: z.string().ip('Invalid IP address'),
  walletAddress: z.string().regex(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
}

// User validation schemas
export const userSchemas = {
  register: z.object({
    email: validationPatterns.email,
    username: validationPatterns.username,
    displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
    password: validationPatterns.password,
    confirmPassword: z.string(),
    role: z.enum(['CONSUMER', 'CREATOR']),
    agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
    subscribeNewsletter: z.boolean().optional()
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  login: z.object({
    email: validationPatterns.email,
    password: z.string().min(1, 'Password is required')
  }),

  updateProfile: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    bio: z.string().max(500, 'Bio too long').optional(),
    website: validationPatterns.url.optional(),
    location: z.string().max(100, 'Location too long').optional(),
    avatar: validationPatterns.url.optional()
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: validationPatterns.password,
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
}

// Model validation schemas
export const modelSchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
    longDescription: z.string().max(2000, 'Long description too long').optional(),
    category: z.enum(['nlp', 'cv', 'audio', 'multimodal', 'rl', 'other']),
    architecture: z.enum(['transformer', 'bert', 'gpt', 'llama', 'falcon', 'other']),
    tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Too many tags'),
    license: z.enum(['mit', 'apache', 'gpl', 'commercial', 'custom']),
    isPublic: z.boolean().default(true)
  }),

  update: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long').optional(),
    longDescription: z.string().max(2000, 'Long description too long').optional(),
    tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Too many tags').optional(),
    isPublic: z.boolean().optional()
  })
}

// Payment validation schemas
export const paymentSchemas = {
  subscription: z.object({
    modelId: validationPatterns.uuid,
    planId: z.string().min(1, 'Plan ID is required'),
    paymentMethod: z.enum(['crypto', 'stripe']),
    walletAddress: z.string().optional(),
    duration: z.enum(['hour', 'day', 'week', 'month'])
  }),

  cryptoPayment: z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.enum(['BTC', 'ETH', 'USDC', 'USDT']),
    walletAddress: validationPatterns.walletAddress,
    transactionHash: z.string().min(1, 'Transaction hash is required')
  })
}

// API validation schemas
export const apiSchemas = {
  inference: z.object({
    modelId: validationPatterns.uuid,
    inputs: z.any(), // Model-specific validation
    parameters: z.record(z.any()).optional(),
    options: z.object({
      maxTokens: z.number().int().positive().max(4096).optional(),
      temperature: z.number().min(0).max(2).optional(),
      topP: z.number().min(0).max(1).optional()
    }).optional()
  }),

  webhook: z.object({
    event: z.string().min(1, 'Event type is required'),
    data: z.record(z.any()),
    timestamp: z.number().int().positive(),
    signature: z.string().min(1, 'Signature is required')
  })
}

// Sanitization functions
export const sanitizers = {
  html: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255)
  },

  slug: (input: string): string => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100)
  },

  searchQuery: (input: string): string => {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 200)
  },

  json: (input: any): any => {
    try {
      const jsonString = JSON.stringify(input)
      return JSON.parse(jsonString)
    } catch {
      return null
    }
  }
}

// Validation middleware wrapper
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return { success: false, errors: result.error }
    }
  }
}

// Rate limit validation
export const rateLimitSchemas = {
  inference: z.object({
    requests: z.number().int().min(1).max(1000),
    period: z.enum(['minute', 'hour', 'day', 'month'])
  }),
  
  subscription: z.object({
    tier: z.enum(['free', 'basic', 'pro', 'enterprise']),
    limits: z.object({
      apiCalls: z.number().int().min(0),
      bandwidth: z.number().int().min(0),
      storage: z.number().int().min(0)
    })
  })
}

// Security validation
export const securityValidation = {
  csrfToken: z.string().min(32, 'Invalid CSRF token'),
  apiKey: z.string().regex(/^[a-zA-Z0-9_-]{32,}$/, 'Invalid API key format'),
  sessionId: z.string().uuid('Invalid session ID'),
  
  // SQL injection detection
  hasSQLInjection: (input: string): boolean => {
    const sqlPatterns = [
      /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\s/i,
      /(\s|^)(OR|AND)\s+\d+\s*=\s*\d+/i,
      /'.*(\s|^)(OR|AND).*'/i,
      /;.*(--)|(\/\*)|(\*\/)/,
      /(EXEC|SP_|XP_)/i
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  },

  // XSS detection
  hasXSS: (input: string): boolean => {
    const xssPatterns = [
      /<script[^>]*>.*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*<\/iframe>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  }
} 