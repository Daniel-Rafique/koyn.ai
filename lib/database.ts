import { PrismaClient } from '@prisma/client'
import { Model, ModelCategory, LicenseType, PricingPlan, Subscription } from './types'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Interface that matches what we get from model sync
interface DatabaseModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  architecture: string;
  tasks: string[];
  modelSize: string;
  contextLength?: string;
  inputModalities: string[];
  outputModalities: string[];
  averageLatency: number;
  license: string;
  version: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  downloadCount: number;
  apiCallCount: number;
  featured: boolean;
  status: string;
  creator: {
    id: string;
    userId: string;
    displayName: string;
    bio: string;
    verified: boolean;
    rating: number;
    totalEarnings: number;
    totalDownloads: number;
  };
  pricing: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    unit: string;
    requestsPerMonth?: number;
    requestsPerMinute?: number;
    maxBatchSize?: number;
    features: string[];
    supportLevel: string;
    stripePriceId?: string;
    active: boolean;
  }>;
  benchmarks?: Array<{
    name: string;
    dataset: string;
    metric: string;
    value: number;
    unit?: string;
    description?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Database operations for Models
export class ModelDatabase {
  
  // Save synced models to database
  async saveModels(models: DatabaseModel[]): Promise<void> {
    for (const model of models) {
      try {
        // First ensure creator profile exists
        await this.ensureCreatorProfile(model.creator)
        
        // Save the model with pricing plans and benchmarks
        await prisma.model.upsert({
          where: { slug: model.slug },
          update: {
            name: model.name,
            description: model.description,
            longDescription: model.longDescription,
            category: this.mapCategoryToDb(model.category as any),
            architecture: model.architecture,
            tasks: model.tasks,
            modelSize: model.modelSize,
            contextLength: model.contextLength,
            inputModalities: model.inputModalities,
            outputModalities: model.outputModalities,
            averageLatency: model.averageLatency,
            license: this.mapLicenseToDb(model.license as any),
            version: model.version,
            tags: model.tags,
            rating: model.rating,
            reviewCount: model.reviewCount,
            downloadCount: model.downloadCount,
            apiCallCount: model.apiCallCount,
            featured: model.featured,
            externalId: model.id.startsWith('hf_') ? model.id.replace('hf_', '').replace('_', '/') : 
                       model.id.startsWith('rep_') ? model.id.replace('rep_', '').replace('_', '/') : null,
            externalSource: model.id.startsWith('hf_') ? 'huggingface' : 
                           model.id.startsWith('rep_') ? 'replicate' : null,
            updatedAt: new Date()
          },
          create: {
            id: model.id,
            name: model.name,
            slug: model.slug,
            description: model.description,
            longDescription: model.longDescription,
            creatorId: model.creator.id,
            category: this.mapCategoryToDb(model.category as any),
            architecture: model.architecture,
            tasks: model.tasks,
            modelSize: model.modelSize,
            contextLength: model.contextLength,
            inputModalities: model.inputModalities,
            outputModalities: model.outputModalities,
            averageLatency: model.averageLatency,
            license: this.mapLicenseToDb(model.license as any),
            version: model.version,
            tags: model.tags,
            rating: model.rating,
            reviewCount: model.reviewCount,
            downloadCount: model.downloadCount,
            apiCallCount: model.apiCallCount,
            featured: model.featured,
            externalId: model.id.startsWith('hf_') ? model.id.replace('hf_', '').replace('_', '/') : 
                       model.id.startsWith('rep_') ? model.id.replace('rep_', '').replace('_', '/') : null,
            externalSource: model.id.startsWith('hf_') ? 'huggingface' : 
                           model.id.startsWith('rep_') ? 'replicate' : null
          }
        })

        // Save pricing plans
        await this.savePricingPlans(model.id, model.pricing as any)
        
        // Save benchmarks
        if (model.benchmarks && model.benchmarks.length > 0) {
          await this.saveBenchmarks(model.id, model.benchmarks)
        }
        
      } catch (error) {
        console.error(`Error saving model ${model.id}:`, error)
      }
    }
  }

  // Get models with filters
  async getModels(filters: {
    category?: string
    search?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ models: any[], total: number }> {
    const where: any = {
      status: 'PUBLISHED'
    }

    if (filters.category && filters.category !== 'all') {
      where.category = this.mapCategoryToDb(filters.category as ModelCategory)
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } }
      ]
    }

    const [models, total] = await Promise.all([
      prisma.model.findMany({
        where,
        include: {
          creator: true,
          pricing: true,
          benchmarks: true,
          _count: {
            select: {
              reviews: true,
              subscriptions: true
            }
          }
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: {
          downloadCount: 'desc'
        }
      }),
      prisma.model.count({ where })
    ])

    return { models, total }
  }

  // Get single model by ID
  async getModelById(id: string): Promise<any | null> {
    return prisma.model.findUnique({
      where: { id },
      include: {
        creator: true,
        pricing: true,
        benchmarks: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
            subscriptions: true
          }
        }
      }
    })
  }

  // Private helper methods
  private async ensureCreatorProfile(creator: any): Promise<void> {
    await prisma.creatorProfile.upsert({
      where: { id: creator.id },
      update: {
        displayName: creator.displayName,
        bio: creator.bio,
        verified: creator.verified,
        rating: creator.rating,
        totalEarnings: creator.totalEarnings,
        totalDownloads: creator.totalDownloads
      },
      create: {
        id: creator.id,
        displayName: creator.displayName,
        bio: creator.bio,
        verified: creator.verified,
        rating: creator.rating,
        totalEarnings: creator.totalEarnings,
        totalDownloads: creator.totalDownloads,
        user: {
          connectOrCreate: {
            where: { id: creator.userId },
            create: {
              id: creator.userId,
              email: `${creator.id}@external.com`,
              name: creator.displayName,
              type: 'CREATOR'
            }
          }
        }
      }
    })
  }

  private async savePricingPlans(modelId: string, plans: any[]): Promise<void> {
    // Delete existing pricing plans
    await prisma.pricingPlan.deleteMany({
      where: { modelId }
    })

    // Create new pricing plans
    for (const plan of plans) {
      await prisma.pricingPlan.create({
        data: {
          id: plan.id,
          modelId,
          name: plan.name,
          type: this.mapPricingTypeToDb(plan.type),
          price: plan.price,
          unit: plan.unit,
          requestsPerMonth: plan.requestsPerMonth,
          requestsPerMinute: plan.requestsPerMinute,
          maxBatchSize: plan.maxBatchSize,
          features: plan.features,
          supportLevel: this.mapSupportLevelToDb(plan.supportLevel),
          stripePriceId: plan.stripePriceId,
          active: plan.active
        }
      })
    }
  }

  private async saveBenchmarks(modelId: string, benchmarks: any[]): Promise<void> {
    // Delete existing benchmarks
    await prisma.benchmark.deleteMany({
      where: { modelId }
    })

    // Create new benchmarks
    for (const benchmark of benchmarks) {
      await prisma.benchmark.create({
        data: {
          modelId,
          name: benchmark.name,
          dataset: benchmark.dataset,
          metric: benchmark.metric,
          value: benchmark.value,
          unit: benchmark.unit,
          description: benchmark.description
        }
      })
    }
  }

  // Enum mapping helpers
  private mapCategoryToDb(category: ModelCategory): any {
    const mapping: Record<string, string> = {
      'nlp': 'NLP',
      'computer-vision': 'COMPUTER_VISION',
      'audio': 'AUDIO',
      'multimodal': 'MULTIMODAL',
      'reinforcement-learning': 'REINFORCEMENT_LEARNING',
      'time-series': 'TIME_SERIES',
      'recommendation': 'RECOMMENDATION',
      'robotics': 'ROBOTICS',
      'other': 'OTHER'
    }
    return mapping[category] || 'OTHER'
  }

  private mapLicenseToDb(license: LicenseType): any {
    const mapping: Record<string, string> = {
      'open-source': 'OPEN_SOURCE',
      'commercial': 'COMMERCIAL',
      'research-only': 'RESEARCH_ONLY',
      'custom': 'CUSTOM'
    }
    return mapping[license] || 'OPEN_SOURCE'
  }

  private mapPricingTypeToDb(type: string): any {
    const mapping: Record<string, string> = {
      'free': 'FREE',
      'freemium': 'FREEMIUM',
      'premium': 'PREMIUM',
      'enterprise': 'ENTERPRISE'
    }
    return mapping[type] || 'PREMIUM'
  }

  private mapSupportLevelToDb(level: string): any {
    const mapping: Record<string, string> = {
      'community': 'COMMUNITY',
      'standard': 'STANDARD',
      'priority': 'PRIORITY'
    }
    return mapping[level] || 'STANDARD'
  }
}

// Database operations for Subscriptions
export class SubscriptionDatabase {
  
  // Create subscription
  async createSubscription(data: {
    userId: string
    modelId: string
    planId: string
    durationHours: number
    paymentMethod?: string
    transactionId?: string
  }): Promise<any> {
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (data.durationHours * 60 * 60 * 1000))

    return prisma.subscription.create({
      data: {
        userId: data.userId,
        modelId: data.modelId,
        planId: data.planId,
        status: 'ACTIVE',
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        helioTransactionId: data.transactionId
      },
      include: {
        user: true,
        model: true,
        plan: true
      }
    })
  }

  // Get user subscriptions
  async getUserSubscriptions(userId: string, activeOnly = true): Promise<any[]> {
    const where: any = { userId }
    
    if (activeOnly) {
      where.status = 'ACTIVE'
      where.currentPeriodEnd = {
        gte: new Date()
      }
    }

    return prisma.subscription.findMany({
      where,
      include: {
        model: {
          include: {
            creator: true
          }
        },
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  // Check if user has active subscription for model
  async hasActiveSubscription(userId: string, modelId: string): Promise<any | null> {
    return prisma.subscription.findFirst({
      where: {
        userId,
        modelId,
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: new Date()
        }
      },
      include: {
        plan: true
      }
    })
  }

  // Update subscription status
  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: status as any }
    })
  }

  // Get subscription analytics
  async getSubscriptionAnalytics(creatorId?: string): Promise<any> {
    const where: any = {}
    if (creatorId) {
      where.model = {
        creatorId
      }
    }

    const [totalSubscriptions, activeSubscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.count({ 
        where: { 
          ...where, 
          status: 'ACTIVE',
          currentPeriodEnd: { gte: new Date() }
        } 
      })
    ])

    // Calculate revenue separately by fetching subscriptions with pricing
    const subscriptionsWithPricing = await prisma.subscription.findMany({
      where,
      include: {
        plan: {
          select: {
            price: true
          }
        }
      }
    })

    const revenue = subscriptionsWithPricing.reduce((total: number, sub: any) => {
      return total + (sub.plan?.price || 0)
    }, 0)

    return {
      totalSubscriptions,
      activeSubscriptions,
      revenue
    }
  }
}

// Export singleton instances
export const modelDb = new ModelDatabase()
export const subscriptionDb = new SubscriptionDatabase() 