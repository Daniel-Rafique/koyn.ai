import { Model, ModelCategory, LicenseType, PricingPlan, ModelArchitecture, PricingUnit } from './types'
import { apiClient } from './api'

interface HuggingFaceModel {
  id: string
  author: string
  sha: string
  downloads: number
  likes: number
  pipeline_tag: string
  tags: string[]
  createdAt: string
  lastModified: string
}

interface ReplicateModel {
  url: string
  owner: string
  name: string
  description: string
  visibility: string
  github_url: string
  paper_url: string
  license_url: string
  cover_image_url: string
  default_example: any
  latest_version: any
}

export class ModelSyncService {
  // Sync from Hugging Face
  async syncHuggingFaceModels(limit = 100): Promise<Model[]> {
    try {
      const response = await fetch(
        `https://huggingface.co/api/models?limit=${limit}&filter=pytorch&sort=downloads`
      )
      const hfModels: HuggingFaceModel[] = await response.json()
      
      return hfModels.map(hfModel => this.transformHuggingFaceModel(hfModel))
    } catch (error) {
      console.error('Error syncing Hugging Face models:', error)
      return []
    }
  }

  // Sync from Replicate
  async syncReplicateModels(): Promise<Model[]> {
    try {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      })
      const data = await response.json()
      
      return data.results.map((model: ReplicateModel) => 
        this.transformReplicateModel(model)
      )
    } catch (error) {
      console.error('Error syncing Replicate models:', error)
      return []
    }
  }

  // Transform Hugging Face model to our format
  private transformHuggingFaceModel(hfModel: HuggingFaceModel): Model {
    const category = this.mapPipelineTagToCategory(hfModel.pipeline_tag)
    const authorName = hfModel.author || hfModel.id.split('/')[0] || 'Unknown'
    
    return {
      id: `hf_${hfModel.id.replace('/', '_')}`,
      name: hfModel.id.split('/').pop() || hfModel.id,
      slug: hfModel.id.replace('/', '-').toLowerCase(),
      description: `${category} model from Hugging Face`,
      longDescription: `Advanced ${category} model available through Hugging Face Hub`,
      creatorId: `hf_${authorName}`,
      creator: {
        id: `hf_${authorName}`,
        userId: `hf_${authorName}`,
        description: authorName,
        bio: 'Hugging Face Creator',
        verified: true,
        rating: 4.5,
        totalEarnings: 0,
        totalDownloads: hfModel.downloads,
        createdAt: new Date().toISOString()
      } as any,
      category,
      architecture: this.extractArchitecture(hfModel.tags),
      supportedTasks: [hfModel.pipeline_tag].filter(Boolean),
      modelSize: this.extractModelSize(hfModel.tags),
      benchmarks: [],
      license: this.mapLicense(hfModel.tags),
      currentVersion: '1.0.0',
      versions: [],
      tags: hfModel.tags.slice(0, 10),
      pricingPlans: this.generateFlexiblePricing(`hf_${hfModel.id.replace('/', '_')}`),
      averageRating: Math.min(4.8, 3.0 + (hfModel.likes / 1000)),
      totalReviews: Math.floor(hfModel.likes / 10),
      downloads: hfModel.downloads,
      likes: hfModel.likes,
      views: 0,
      isFreeTier: false,
      isPublished: true,
      isFeatured: hfModel.downloads > 10000,
      modelFiles: [],
      sampleFiles: [],
      createdAt: hfModel.createdAt,
      updatedAt: hfModel.lastModified
    }
  }

  // Transform Replicate model to our format
  private transformReplicateModel(repModel: ReplicateModel): Model {
    const [owner, name] = repModel.url.split('/').slice(-2)
    
    return {
      id: `rep_${owner}_${name}`,
      name: name,
      slug: `${owner}-${name}`.toLowerCase(),
      description: repModel.description || `${name} model from Replicate`,
      longDescription: repModel.description,
      creatorId: `rep_${owner}`,
      creator: {
        id: `rep_${owner}`,
        userId: `rep_${owner}`,
        description: owner,
        bio: 'Replicate Creator',
        verified: true,
        rating: 4.6,
        totalEarnings: 0,
        totalDownloads: 0,
        createdAt: new Date().toISOString()
      } as any,
      category: 'other' as ModelCategory,
      architecture: ModelArchitecture.TRANSFORMER,
      supportedTasks: ['general'],
      modelSize: 'Unknown',
      benchmarks: [],
      license: 'custom' as LicenseType,
      currentVersion: repModel.latest_version?.id || '1.0.0',
      versions: [],
      tags: [],
      pricingPlans: this.generateFlexiblePricing(`rep_${owner}_${name}`),
      averageRating: 4.0,
      totalReviews: 0,
      downloads: 0,
      likes: 0,
      views: 0,
      isFreeTier: false,
      isPublished: true,
      isFeatured: false,
      modelFiles: [],
      sampleFiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Generate flexible pricing tiers (your value proposition)
  private generateFlexiblePricing(modelId: string): PricingPlan[] {
    const basePrice = 0.02 // Base price per 1k tokens

    return [
      {
        id: `${modelId}_hourly`,
        modelId,
        name: 'Hourly Access',
        description: 'Hourly access to the model',
        unit: 'hour' as PricingUnit,
        pricePerUnit: basePrice * 100, // $2/hour
        currency: 'USD',
        features: ['1 hour access', 'API Access', 'Standard Support'],
        isPopular: false
      },
      {
        id: `${modelId}_daily`,
        modelId,
        name: 'Daily Access',
        description: 'Daily access to the model',
        unit: 'day' as PricingUnit,
        pricePerUnit: basePrice * 400, // $8/day (discount)
        currency: 'USD',
        features: ['24 hour access', 'API Access', 'Priority Support'],
        isPopular: false
      },
      {
        id: `${modelId}_weekly`,
        modelId,
        name: 'Weekly Access',
        description: 'Weekly access to the model',
        unit: 'week' as PricingUnit,
        pricePerUnit: basePrice * 1500, // $30/week (bigger discount)
        currency: 'USD',
        features: ['7 day access', 'API Access', 'Priority Support', 'Usage Analytics'],
        isPopular: true
      },
      {
        id: `${modelId}_monthly`,
        modelId,
        name: 'Monthly Access',
        description: 'Monthly access to the model',
        unit: 'month' as PricingUnit,
        pricePerUnit: basePrice * 5000, // $100/month (best value)
        currency: 'USD',
        features: ['30 day access', 'API Access', 'Priority Support', 'Usage Analytics', 'Custom Limits'],
        isPopular: false
      }
    ]
  }

  // Helper methods
  private mapPipelineTagToCategory(tag: string): ModelCategory {
    const mapping: Record<string, ModelCategory> = {
      'text-generation': ModelCategory.NLP,
      'text-classification': ModelCategory.NLP,
      'question-answering': ModelCategory.NLP,
      'summarization': ModelCategory.NLP,
      'translation': ModelCategory.NLP,
      'image-classification': ModelCategory.CV,
      'object-detection': ModelCategory.CV,
      'image-to-text': ModelCategory.MULTIMODAL,
      'automatic-speech-recognition': ModelCategory.AUDIO,
      'text-to-speech': ModelCategory.AUDIO,
      'reinforcement-learning': ModelCategory.RL
    }
    return mapping[tag] || ModelCategory.NLP
  }

  private extractArchitecture(tags: string[]): ModelArchitecture {
    const architectures = ['transformer', 'bert', 'gpt', 'llama', 'falcon', 'mistral']
    const found = tags.find(tag => 
      architectures.some(arch => tag.toLowerCase().includes(arch))
    )
    
    if (found) {
      if (found.toLowerCase().includes('bert')) return ModelArchitecture.BERT
      if (found.toLowerCase().includes('gpt')) return ModelArchitecture.GPT
      if (found.toLowerCase().includes('llama')) return ModelArchitecture.LLAMA
      if (found.toLowerCase().includes('falcon')) return ModelArchitecture.FALCON
    }
    
    return ModelArchitecture.TRANSFORMER
  }

  private extractModelSize(tags: string[]): string {
    const sizeTag = tags.find(tag => /\d+[bmk]/i.test(tag))
    return sizeTag ? `${sizeTag} parameters` : 'Unknown size'
  }

  private getInputModalities(pipelineTag: string): string[] {
    const mapping: Record<string, string[]> = {
      'text-generation': ['text'],
      'image-classification': ['image'],
      'automatic-speech-recognition': ['audio'],
      'image-to-text': ['image'],
      'text-to-speech': ['text']
    }
    return mapping[pipelineTag] || ['text']
  }

  private getOutputModalities(pipelineTag: string): string[] {
    const mapping: Record<string, string[]> = {
      'text-generation': ['text'],
      'image-classification': ['text'],
      'automatic-speech-recognition': ['text'],
      'image-to-text': ['text'],
      'text-to-speech': ['audio']
    }
    return mapping[pipelineTag] || ['text']
  }

  private mapLicense(tags: string[]): LicenseType {
    if (tags.some(tag => tag.includes('apache') || tag.includes('mit'))) {
      return LicenseType.MIT
    }
    if (tags.some(tag => tag.includes('commercial'))) {
      return LicenseType.COMMERCIAL
    }
    return LicenseType.MIT
  }
}

export const modelSyncService = new ModelSyncService() 