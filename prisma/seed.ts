import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@koyn.ai' },
    update: {},
    create: {
      email: 'admin@koyn.ai',
      name: 'Admin User',
      password: adminPassword,
      type: 'CREATOR',
      emailVerified: new Date(),
    },
  })

  // Create creator profiles
  const metaCreator = await prisma.creatorProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      displayName: 'Meta AI',
      bio: 'Building the next generation of AI models for everyone.',
      website: 'https://ai.meta.com',
      github: 'facebookresearch',
      verified: true,
      rating: 4.8,
      totalEarnings: 0,
      totalDownloads: 125000,
    },
  })

  // Create test user
  const testUserPassword = await bcrypt.hash('test123', 10)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: testUserPassword,
      type: 'CONSUMER',
      emailVerified: new Date(),
    },
  })

  // Create another creator
  const openaiCreator = await prisma.user.upsert({
    where: { email: 'creator@openai.com' },
    update: {},
    create: {
      email: 'creator@openai.com',
      name: 'OpenAI Research',
      type: 'CREATOR',
      emailVerified: new Date(),
    },
  })

  const openaiProfile = await prisma.creatorProfile.upsert({
    where: { userId: openaiCreator.id },
    update: {},
    create: {
      userId: openaiCreator.id,
      displayName: 'OpenAI',
      bio: 'Creating safe AI that benefits all of humanity.',
      website: 'https://openai.com',
      github: 'openai',
      verified: true,
      rating: 4.9,
      totalEarnings: 0,
      totalDownloads: 89000,
    },
  })

  // Create sample models
  const llamaModel = await prisma.model.upsert({
    where: { slug: 'llama-2-70b-chat' },
    update: {},
    create: {
      name: 'LLaMA 2 70B Chat',
      slug: 'llama-2-70b-chat',
      description: 'A large language model fine-tuned for conversational use cases with exceptional reasoning capabilities.',
      longDescription: 'LLaMA 2 70B Chat is a fine-tuned version of LLaMA 2 70B, specifically optimized for conversational AI applications. This model demonstrates remarkable performance in dialogue, reasoning, and instruction following while maintaining safety and helpfulness.',
      creatorId: metaCreator.id,
      category: 'NLP',
      architecture: 'LLaMA',
      tasks: ['chat', 'reasoning', 'instruction-following'],
      modelSize: '70B parameters',
      contextLength: '4096 tokens',
      inputModalities: ['text'],
      outputModalities: ['text'],
      averageLatency: 150,
      license: 'OPEN_SOURCE',
      version: '2.0.0',
      tags: ['chat', 'reasoning', 'multilingual', 'instruction-following'],
      rating: 4.8,
      reviewCount: 234,
      downloadCount: 125000,
      apiCallCount: 890000,
      featured: true,
      externalId: 'meta-llama/Llama-2-70b-chat-hf',
      externalSource: 'huggingface',
      status: 'PUBLISHED',
    },
  })

  const clipModel = await prisma.model.upsert({
    where: { slug: 'clip-vision-encoder' },
    update: {},
    create: {
      name: 'CLIP Vision Encoder',
      slug: 'clip-vision-encoder',
      description: 'Connects text and images in a single embedding space for powerful multimodal applications.',
      longDescription: 'CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs. It can be instructed in natural language to predict the most relevant text snippet, given an image.',
      creatorId: openaiProfile.id,
      category: 'COMPUTER_VISION',
      architecture: 'Transformer',
      tasks: ['image-classification', 'zero-shot-classification', 'multimodal-embeddings'],
      modelSize: '400M parameters',
      contextLength: '77 tokens',
      inputModalities: ['text', 'image'],
      outputModalities: ['embeddings'],
      averageLatency: 80,
      license: 'OPEN_SOURCE',
      version: '1.0.0',
      tags: ['multimodal', 'embeddings', 'zero-shot', 'vision'],
      rating: 4.6,
      reviewCount: 156,
      downloadCount: 89000,
      apiCallCount: 450000,
      featured: true,
      externalId: 'openai/clip-vit-base-patch32',
      externalSource: 'huggingface',
      status: 'PUBLISHED',
    },
  })

  const whisperModel = await prisma.model.upsert({
    where: { slug: 'whisper-large-v3' },
    update: {},
    create: {
      name: 'Whisper Large V3',
      slug: 'whisper-large-v3',
      description: 'State-of-the-art speech recognition model supporting 99 languages with high accuracy.',
      longDescription: 'Whisper is a general-purpose speech recognition model trained on a large dataset of diverse audio. It is designed to be robust to accents, background noise, and technical language.',
      creatorId: openaiProfile.id,
      category: 'AUDIO',
      architecture: 'Transformer',
      tasks: ['speech-to-text', 'audio-transcription', 'multilingual-asr'],
      modelSize: '1.55B parameters',
      contextLength: '30 seconds',
      inputModalities: ['audio'],
      outputModalities: ['text'],
      averageLatency: 200,
      license: 'OPEN_SOURCE',
      version: '3.0.0',
      tags: ['speech-to-text', 'multilingual', 'robust', 'transcription'],
      rating: 4.9,
      reviewCount: 89,
      downloadCount: 67000,
      apiCallCount: 320000,
      featured: false,
      externalId: 'openai/whisper-large-v3',
      externalSource: 'huggingface',
      status: 'PUBLISHED',
    },
  })

  // Create pricing plans
  await prisma.pricingPlan.createMany({
    data: [
      // LLaMA pricing
      {
        modelId: llamaModel.id,
        name: 'Pay per Use',
        type: 'PREMIUM',
        price: 0.02,
        unit: '1k tokens',
        requestsPerMonth: null,
        requestsPerMinute: 60,
        maxBatchSize: 1,
        features: ['API Access', 'Standard Support'],
        supportLevel: 'STANDARD',
        active: true,
      },
      {
        modelId: llamaModel.id,
        name: 'Pro Plan',
        type: 'PREMIUM',
        price: 49.99,
        unit: 'month',
        requestsPerMonth: 100000,
        requestsPerMinute: 120,
        maxBatchSize: 5,
        features: ['API Access', 'Priority Support', 'Analytics Dashboard'],
        supportLevel: 'PRIORITY',
        active: true,
      },
      // CLIP pricing
      {
        modelId: clipModel.id,
        name: 'Free Tier',
        type: 'FREE',
        price: 0,
        unit: 'request',
        requestsPerMonth: 1000,
        requestsPerMinute: 10,
        maxBatchSize: 1,
        features: ['API Access', 'Community Support'],
        supportLevel: 'COMMUNITY',
        active: true,
      },
      {
        modelId: clipModel.id,
        name: 'Premium',
        type: 'PREMIUM',
        price: 19.99,
        unit: 'month',
        requestsPerMonth: 50000,
        requestsPerMinute: 100,
        maxBatchSize: 10,
        features: ['API Access', 'Standard Support', 'Higher Rate Limits'],
        supportLevel: 'STANDARD',
        active: true,
      },
      // Whisper pricing
      {
        modelId: whisperModel.id,
        name: 'Freemium',
        type: 'FREEMIUM',
        price: 0.006,
        unit: 'minute',
        requestsPerMonth: 100,
        requestsPerMinute: 5,
        maxBatchSize: 1,
        features: ['API Access', 'Community Support', '100 free minutes/month'],
        supportLevel: 'COMMUNITY',
        active: true,
      },
    ],
  })

  // Create some sample reviews
  await prisma.review.createMany({
    data: [
      {
        userId: testUser.id,
        modelId: llamaModel.id,
        rating: 5,
        title: 'Excellent Performance',
        content: 'Excellent model for conversational AI. Very responsive and accurate.',
        helpful: 15,
      },
      {
        userId: testUser.id,
        modelId: clipModel.id,
        rating: 4,
        title: 'Great Integration',
        content: 'Great for multimodal applications. Easy to integrate.',
        helpful: 8,
      },
      {
        userId: testUser.id,
        modelId: whisperModel.id,
        rating: 5,
        title: 'Best Speech Recognition',
        content: 'Best speech recognition I\'ve used. Handles multiple languages perfectly.',
        helpful: 12,
      },
    ],
  })

  // Create sample API keys
  await prisma.aPIKey.create({
    data: {
      userId: testUser.id,
      name: 'Development Key',
      keyHash: await bcrypt.hash('test_api_key_123', 10),
      rateLimit: 1000,
      isActive: true,
    },
  })

  // Create sample benchmarks
  await prisma.benchmark.createMany({
    data: [
      {
        modelId: llamaModel.id,
        name: 'HellaSwag',
        value: 0.85,
        metric: 'accuracy',
        dataset: 'HellaSwag validation set',
      },
      {
        modelId: llamaModel.id,
        name: 'MMLU',
        value: 0.68,
        metric: 'accuracy',
        dataset: 'Massive Multitask Language Understanding',
      },
      {
        modelId: clipModel.id,
        name: 'ImageNet',
        value: 0.76,
        metric: 'top-1 accuracy',
        dataset: 'ImageNet validation set',
      },
      {
        modelId: whisperModel.id,
        name: 'LibriSpeech',
        value: 0.025,
        metric: 'WER',
        dataset: 'LibriSpeech test-clean',
      },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user created: admin@koyn.ai (password: admin123)`)
  console.log(`👤 Test user created: test@example.com (password: test123)`)
  console.log(`🤖 Created ${3} sample models with pricing plans`)
  console.log(`⭐ Created sample reviews and benchmarks`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 