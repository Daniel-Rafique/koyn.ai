import { NextRequest, NextResponse } from 'next/server'
import { modelSyncService } from '@/lib/model-sync'
import { modelDb } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { source, limit } = await request.json()
    
    let models: any[] = []
    
    switch (source) {
      case 'huggingface':
        models = await modelSyncService.syncHuggingFaceModels(limit || 50)
        break
      case 'replicate':
        models = await modelSyncService.syncReplicateModels()
        break
      case 'all':
        const [hfModels, repModels] = await Promise.all([
          modelSyncService.syncHuggingFaceModels(25),
          modelSyncService.syncReplicateModels()
        ])
        models = [...hfModels, ...repModels]
        break
      default:
        return NextResponse.json(
          { error: 'Invalid source. Use: huggingface, replicate, or all' },
          { status: 400 }
        )
    }

    // Save models to database
    await modelDb.saveModels(models)
    
    return NextResponse.json({
      success: true,
      message: `Synced and saved ${models.length} models from ${source}`,
      data: {
        count: models.length,
        models: models.slice(0, 5) // Return first 5 as preview
      }
    })
    
  } catch (error) {
    console.error('Error syncing models:', error)
    return NextResponse.json(
      { error: 'Failed to sync models' },
      { status: 500 }
    )
  }
}

// Get sync status
export async function GET() {
  try {
    // Get total models count from database
    const { total } = await modelDb.getModels({ limit: 0 })
    
    return NextResponse.json({
      success: true,
      message: 'Model sync service is running',
      data: {
        totalModelsInDatabase: total
      },
      endpoints: {
        huggingface: 'POST /api/models/sync with { "source": "huggingface", "limit": 50 }',
        replicate: 'POST /api/models/sync with { "source": "replicate" }',
        all: 'POST /api/models/sync with { "source": "all" }'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      message: 'Model sync service is running',
      endpoints: {
        huggingface: 'POST /api/models/sync with { "source": "huggingface", "limit": 50 }',
        replicate: 'POST /api/models/sync with { "source": "replicate" }',
        all: 'POST /api/models/sync with { "source": "all" }'
      }
    })
  }
} 