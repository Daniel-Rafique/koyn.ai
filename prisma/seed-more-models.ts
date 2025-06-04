import { PrismaClient, ModelCategory, License, ModelStatus, PricingType, SupportLevel } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMoreModels() {
  console.log('🌱 Adding more models to the marketplace...')

  // Get existing creators
  const creators = await prisma.creatorProfile.findMany({
    include: { user: true }
  })

  if (creators.length === 0) {
    console.log('❌ No creators found. Run the main seed first.')
    return
  }

  const metaCreator = creators.find(c => c.displayName === 'Meta AI')
  const openaiCreator = creators.find(c => c.displayName === 'OpenAI')

  // Create additional models
  const newModels = [
    // Language Models
    {
      name: 'Code Llama 34B',
      slug: 'code-llama-34b',
      description: 'A state-of-the-art code generation model fine-tuned on code datasets.',
      longDescription: 'Code Llama is a family of large language models for code based on Llama 2 providing state-of-the-art performance among open models, infilling capabilities, support for large input contexts, and zero-shot instruction following ability for programming tasks.',
      creatorId: metaCreator?.id || creators[0].id,
      category: ModelCategory.NLP,
      architecture: 'LLaMA',
      tasks: ['code-generation', 'code-completion', 'programming-assistance'],
      modelSize: '34B parameters',
      contextLength: '16384 tokens',
      inputModalities: ['text'],
      outputModalities: ['text'],
      averageLatency: 200,
      license: License.OPEN_SOURCE,
      version: '1.0.0',
      tags: ['coding', 'programming', 'code-generation', 'llama'],
      rating: 4.7,
      reviewCount: 186,
      downloadCount: 95000,
      apiCallCount: 650000,
      featured: true,
      externalId: 'codellama/CodeLlama-34b-Instruct-hf',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    {
      name: 'GPT-3.5 Turbo',
      slug: 'gpt-3-5-turbo',
      description: 'Fast, capable model for most conversational and text generation tasks.',
      longDescription: 'GPT-3.5 Turbo is OpenAI\'s most capable and cost-effective model in the GPT-3.5 family. It\'s optimized for chat applications and can handle a wide variety of natural language tasks.',
      creatorId: openaiCreator?.id || creators[1]?.id || creators[0].id,
      category: ModelCategory.NLP,
      architecture: 'Transformer',
      tasks: ['conversation', 'text-generation', 'question-answering'],
      modelSize: '175B parameters',
      contextLength: '4096 tokens',
      inputModalities: ['text'],
      outputModalities: ['text'],
      averageLatency: 100,
      license: License.COMMERCIAL,
      version: '0301',
      tags: ['chatbot', 'conversation', 'text-generation', 'gpt'],
      rating: 4.8,
      reviewCount: 1250,
      downloadCount: 500000,
      apiCallCount: 2500000,
      featured: true,
      externalId: 'gpt-3.5-turbo',
      externalSource: 'openai',
      status: ModelStatus.PUBLISHED,
    },
    // Computer Vision Models
    {
      name: 'YOLO v8',
      slug: 'yolo-v8',
      description: 'State-of-the-art object detection model with real-time performance.',
      longDescription: 'YOLOv8 is the latest version of the YOLO (You Only Look Once) object detection algorithm, offering improved accuracy and speed for real-time object detection tasks.',
      creatorId: creators[0].id,
      category: ModelCategory.COMPUTER_VISION,
      architecture: 'CNN',
      tasks: ['object-detection', 'image-classification', 'instance-segmentation'],
      modelSize: '85M parameters',
      contextLength: 'Variable image sizes',
      inputModalities: ['image'],
      outputModalities: ['bounding_boxes', 'labels'],
      averageLatency: 50,
      license: License.OPEN_SOURCE,
      version: '8.0.0',
      tags: ['object-detection', 'real-time', 'computer-vision', 'yolo'],
      rating: 4.6,
      reviewCount: 324,
      downloadCount: 180000,
      apiCallCount: 890000,
      featured: false,
      externalId: 'ultralytics/yolov8n',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    {
      name: 'Stable Diffusion XL',
      slug: 'stable-diffusion-xl',
      description: 'Advanced text-to-image generation model with high-quality outputs.',
      longDescription: 'Stable Diffusion XL (SDXL) is an upgraded version of Stable Diffusion that delivers enhanced image quality and composition with shorter prompts.',
      creatorId: creators[0].id,
      category: ModelCategory.COMPUTER_VISION,
      architecture: 'Diffusion',
      tasks: ['text-to-image', 'image-generation', 'art-creation'],
      modelSize: '3.5B parameters',
      contextLength: '77 tokens',
      inputModalities: ['text'],
      outputModalities: ['image'],
      averageLatency: 3000,
      license: License.OPEN_SOURCE,
      version: '1.0.0',
      tags: ['text-to-image', 'art', 'creative', 'diffusion'],
      rating: 4.9,
      reviewCount: 892,
      downloadCount: 350000,
      apiCallCount: 1200000,
      featured: true,
      externalId: 'stabilityai/stable-diffusion-xl-base-1.0',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    // Audio Models
    {
      name: 'MusicGen Large',
      slug: 'musicgen-large',
      description: 'AI music generation model that creates high-quality musical compositions.',
      longDescription: 'MusicGen is a controllable music generation model that can generate high-quality music samples conditioned on textual descriptions.',
      creatorId: metaCreator?.id || creators[0].id,
      category: ModelCategory.AUDIO,
      architecture: 'Transformer',
      tasks: ['music-generation', 'audio-synthesis', 'composition'],
      modelSize: '3.3B parameters',
      contextLength: '30 seconds',
      inputModalities: ['text'],
      outputModalities: ['audio'],
      averageLatency: 10000,
      license: License.OPEN_SOURCE,
      version: '1.0.0',
      tags: ['music', 'audio-generation', 'composition', 'creative'],
      rating: 4.5,
      reviewCount: 145,
      downloadCount: 75000,
      apiCallCount: 250000,
      featured: false,
      externalId: 'facebook/musicgen-large',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    {
      name: 'Bark',
      slug: 'bark-text-to-speech',
      description: 'Multilingual text-to-speech model with voice cloning capabilities.',
      longDescription: 'Bark is a transformer-based text-to-audio model that can generate highly realistic, multilingual speech as well as other audio like music, background noise and simple sound effects.',
      creatorId: creators[0].id,
      category: ModelCategory.AUDIO,
      architecture: 'Transformer',
      tasks: ['text-to-speech', 'voice-synthesis', 'audio-generation'],
      modelSize: '1.7B parameters',
      contextLength: 'Variable',
      inputModalities: ['text'],
      outputModalities: ['audio'],
      averageLatency: 5000,
      license: License.OPEN_SOURCE,
      version: '1.0.0',
      tags: ['text-to-speech', 'voice-cloning', 'multilingual', 'audio'],
      rating: 4.4,
      reviewCount: 203,
      downloadCount: 120000,
      apiCallCount: 480000,
      featured: false,
      externalId: 'suno/bark',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    // Multimodal Models
    {
      name: 'LLaVA 1.5',
      slug: 'llava-1-5',
      description: 'Large Language and Vision Assistant for visual question answering.',
      longDescription: 'LLaVA (Large Language-and-Vision Assistant) is a multimodal model that combines vision and language understanding for visual instruction following.',
      creatorId: creators[0].id,
      category: ModelCategory.MULTIMODAL,
      architecture: 'Transformer',
      tasks: ['visual-question-answering', 'image-captioning', 'multimodal-chat'],
      modelSize: '13B parameters',
      contextLength: '2048 tokens',
      inputModalities: ['text', 'image'],
      outputModalities: ['text'],
      averageLatency: 300,
      license: License.OPEN_SOURCE,
      version: '1.5.0',
      tags: ['multimodal', 'vision-language', 'vqa', 'assistant'],
      rating: 4.3,
      reviewCount: 167,
      downloadCount: 95000,
      apiCallCount: 320000,
      featured: false,
      externalId: 'liuhaotian/llava-v1.5-13b',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    // More Specialized Models
    {
      name: 'CodeT5+',
      slug: 'codet5-plus',
      description: 'Code understanding and generation model for software development.',
      longDescription: 'CodeT5+ is a family of encoder-decoder language models for code understanding and generation, supporting code summarization, generation, translation, and more.',
      creatorId: creators[0].id,
      category: ModelCategory.NLP,
      architecture: 'T5',
      tasks: ['code-summarization', 'code-generation', 'code-translation'],
      modelSize: '770M parameters',
      contextLength: '512 tokens',
      inputModalities: ['text'],
      outputModalities: ['text'],
      averageLatency: 150,
      license: License.OPEN_SOURCE,
      version: '1.0.0',
      tags: ['coding', 'code-understanding', 'software-engineering', 't5'],
      rating: 4.2,
      reviewCount: 98,
      downloadCount: 65000,
      apiCallCount: 280000,
      featured: false,
      externalId: 'Salesforce/codet5p-770m',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    {
      name: 'BERT Large',
      slug: 'bert-large-uncased',
      description: 'Bidirectional transformer for language understanding tasks.',
      longDescription: 'BERT (Bidirectional Encoder Representations from Transformers) is designed to pre-train deep bidirectional representations from unlabeled text.',
      creatorId: creators[0].id,
      category: ModelCategory.NLP,
      architecture: 'BERT',
      tasks: ['text-classification', 'named-entity-recognition', 'question-answering'],
      modelSize: '340M parameters',
      contextLength: '512 tokens',
      inputModalities: ['text'],
      outputModalities: ['embeddings', 'classifications'],
      averageLatency: 80,
      license: License.OPEN_SOURCE,
      version: '1.0.0',
      tags: ['language-understanding', 'classification', 'embeddings', 'bert'],
      rating: 4.6,
      reviewCount: 445,
      downloadCount: 280000,
      apiCallCount: 950000,
      featured: false,
      externalId: 'bert-large-uncased',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    },
    {
      name: 'ControlNet',
      slug: 'controlnet-canny',
      description: 'Neural network structure to control diffusion models for precise image generation.',
      longDescription: 'ControlNet is a neural network structure to control diffusion models by adding extra conditions, enabling precise control over image generation.',
      creatorId: creators[0].id,
      category: ModelCategory.COMPUTER_VISION,
      architecture: 'ControlNet',
      tasks: ['controlled-image-generation', 'image-conditioning', 'style-transfer'],
      modelSize: '860M parameters',
      contextLength: 'Variable',
      inputModalities: ['image', 'text'],
      outputModalities: ['image'],
      averageLatency: 2500,
      license: License.OPEN_SOURCE,
      version: '1.1.0',
      tags: ['controlnet', 'image-control', 'diffusion', 'precision'],
      rating: 4.7,
      reviewCount: 234,
      downloadCount: 145000,
      apiCallCount: 560000,
      featured: false,
      externalId: 'lllyasviel/ControlNet-v1-1',
      externalSource: 'huggingface',
      status: ModelStatus.PUBLISHED,
    }
  ]

  console.log(`🔄 Creating ${newModels.length} new models...`)

  for (const modelData of newModels) {
    await prisma.model.upsert({
      where: { slug: modelData.slug },
      update: {},
      create: modelData,
    })
  }

  // Create pricing plans for new models
  const createdModels = await prisma.model.findMany({
    where: {
      slug: { in: newModels.map(m => m.slug) }
    }
  })

  console.log('💰 Creating pricing plans...')

  for (const model of createdModels) {
    // Create different pricing plans based on model type
    const pricingPlans = []

    if (model.category === ModelCategory.NLP) {
      pricingPlans.push({
        modelId: model.id,
        name: 'Pay per Token',
        type: PricingType.PREMIUM,
        price: Math.random() * 0.05 + 0.01, // $0.01-$0.06 per 1k tokens
        unit: '1k tokens',
        requestsPerMonth: null,
        requestsPerMinute: 60,
        maxBatchSize: 1,
        features: ['API Access', 'Standard Support'],
        supportLevel: SupportLevel.STANDARD,
        active: true,
      })
    } else if (model.category === ModelCategory.COMPUTER_VISION) {
      pricingPlans.push({
        modelId: model.id,
        name: 'Per Image',
        type: PricingType.PREMIUM,
        price: Math.random() * 0.5 + 0.1, // $0.10-$0.60 per image
        unit: 'image',
        requestsPerMonth: null,
        requestsPerMinute: 30,
        maxBatchSize: 10,
        features: ['API Access', 'Basic Support'],
        supportLevel: SupportLevel.COMMUNITY,
        active: true,
      })
    } else if (model.category === ModelCategory.AUDIO) {
      pricingPlans.push({
        modelId: model.id,
        name: 'Per Minute',
        type: PricingType.PREMIUM,
        price: Math.random() * 0.2 + 0.05, // $0.05-$0.25 per minute
        unit: 'minute',
        requestsPerMonth: null,
        requestsPerMinute: 10,
        maxBatchSize: 1,
        features: ['API Access', 'Standard Support'],
        supportLevel: SupportLevel.STANDARD,
        active: true,
      })
    } else {
      pricingPlans.push({
        modelId: model.id,
        name: 'Standard Plan',
        type: PricingType.PREMIUM,
        price: Math.random() * 0.1 + 0.02, // $0.02-$0.12 per request
        unit: 'request',
        requestsPerMonth: null,
        requestsPerMinute: 20,
        maxBatchSize: 5,
        features: ['API Access', 'Standard Support'],
        supportLevel: SupportLevel.STANDARD,
        active: true,
      })
    }

    await prisma.pricingPlan.createMany({
      data: pricingPlans,
      skipDuplicates: true,
    })
  }

  console.log(`✅ Successfully added ${newModels.length} models with pricing plans!`)
}

seedMoreModels()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 