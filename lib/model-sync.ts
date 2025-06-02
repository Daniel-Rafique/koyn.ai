import { Model, ModelCategory, License, PricingPlan } from './types'
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
    
    return {
      id: `hf_${hfModel.id.replace('/', '_')}`,
      name: hfModel.id.split('/').pop() || hfModel.id,
      slug: hfModel.id.replace('/', '-').toLowerCase(),
      description: `${category} model from Hugging Face`,
      longDescription: `Advanced ${category} model available through Hugging Face Hub`,
      creatorId: `hf_${hfModel.author}`,
      creator: {
        id: `hf_${hfModel.author}`,
        userId: `hf_${hfModel.author}`,
        displayName: hfModel.author,
        bio: 'Hugging Face Creator',
        verified: true,
        rating: 4.5,
        totalEarnings: 0,
        totalDownloads: hfModel.downloads,
        createdAt: new Date()
      },
      category,
      architecture: this.extractArchitecture(hfModel.tags),
      tasks: [hfModel.pipeline_tag],
      modelSize: this.extractModelSize(hfModel.tags),
      inputModalities: this.getInputModalities(hfModel.pipeline_tag),
      outputModalities: this.getOutputModalities(hfModel.pipeline_tag),
      benchmarks: [],
      averageLatency: 100,
      license: this.mapLicense(hfModel.tags),
      version: '1.0.0',
      versions: [],
      tags: hfModel.tags.slice(0, 10),
      pricing: this.generateFlexiblePricing(`hf_${hfModel.id.replace('/', '_')}`),
      rating: Math.min(4.8, 3.0 + (hfModel.likes / 1000)),
      reviewCount: Math.floor(hfModel.likes / 10),
      downloadCount: hfModel.downloads,
      apiCallCount: 0,
      status: 'published' as const,
      featured: hfModel.downloads > 10000,
      modelFiles: [],
      createdAt: new Date(hfModel.createdAt),
      updatedAt: new Date(hfModel.lastModified)
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
        displayName: owner,
        bio: 'Replicate Creator',
        verified: true,
        rating: 4.6,
        totalEarnings: 0,
        totalDownloads: 0,
        createdAt: new Date()
      },
      category: 'other' as ModelCategory,
      architecture: 'Unknown',
      tasks: ['general'],
      modelSize: 'Unknown',
      inputModalities: ['text'],
      outputModalities: ['text'],
      benchmarks: [],
      averageLatency: 200,
      license: 'custom' as License,
      version: repModel.latest_version?.id || '1.0.0',
      versions: [],
      tags: [],
      pricing: this.generateFlexiblePricing(`rep_${owner}_${name}`),
      rating: 4.0,
      reviewCount: 0,
      downloadCount: 0,
      apiCallCount: 0,
      status: 'published' as const,
      featured: false,
      modelFiles: [],
      createdAt: new Date(),
      updatedAt: new Date()
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
        type: 'premium',
        price: basePrice * 100, // $2/hour
        unit: 'hour',
        features: ['1 hour access', 'API Access', 'Standard Support'],
        supportLevel: 'standard',
        active: true
      },
      {
        id: `${modelId}_daily`,
        modelId,
        name: 'Daily Access',
        type: 'premium', 
        price: basePrice * 400, // $8/day (discount)
        unit: 'day',
        features: ['24 hour access', 'API Access', 'Priority Support'],
        supportLevel: 'priority',
        active: true
      },
      {
        id: `${modelId}_weekly`,
        modelId,
        name: 'Weekly Access',
        type: 'premium',
        price: basePrice * 1500, // $30/week (bigger discount)
        unit: 'week', 
        features: ['7 day access', 'API Access', 'Priority Support', 'Usage Analytics'],
        supportLevel: 'priority',
        active: true
      },
      {
        id: `${modelId}_monthly`,
        modelId,
        name: 'Monthly Access',
        type: 'premium',
        price: basePrice * 5000, // $100/month (best value)
        unit: 'month',
        features: ['30 day access', 'API Access', 'Priority Support', 'Usage Analytics', 'Custom Limits'],
        supportLevel: 'priority',
        active: true
      }
    ]
  }

  // Helper methods
  private mapPipelineTagToCategory(tag: string): ModelCategory {
    const mapping: Record<string, ModelCategory> = {
      'text-generation': 'nlp',
      'text-classification': 'nlp',
      'question-answering': 'nlp',
      'summarization': 'nlp',
      'translation': 'nlp',
      'image-classification': 'computer-vision',
      'object-detection': 'computer-vision',
      'image-to-text': 'multimodal',
      'automatic-speech-recognition': 'audio',
      'text-to-speech': 'audio',
      'reinforcement-learning': 'reinforcement-learning'
    }
    return mapping[tag] || 'other'
  }

  private extractArchitecture(tags: string[]): string {
    const architectures = ['transformer', 'bert', 'gpt', 'llama', 'falcon', 'mistral']
    const found = tags.find(tag => 
      architectures.some(arch => tag.toLowerCase().includes(arch))
    )
    return found || 'Transformer'
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

  private mapLicense(tags: string[]): License {
    if (tags.some(tag => tag.includes('apache') || tag.includes('mit'))) {
      return 'open-source'
    }
    if (tags.some(tag => tag.includes('commercial'))) {
      return 'commercial'
    }
    return 'open-source'
  }
}

export const modelSyncService = new ModelSyncService() 