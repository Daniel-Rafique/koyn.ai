import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions, Permission } from '@/lib/rbac'
import { softDeleteService } from '@/lib/soft-delete'

// POST - Cleanup old soft deleted data
export async function POST(request: NextRequest) {
  // Check admin permissions
  const authResult = await requirePermissions(request, [Permission.ADMIN_SYSTEM])
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { retentionDays = 90, dryRun = true } = body

    console.log(`🧹 Starting cleanup process - retention: ${retentionDays} days, dry run: ${dryRun}`)

    if (dryRun) {
      // Just report what would be cleaned up
      await softDeleteService.cleanupOldDeletedData(retentionDays)
      
      return NextResponse.json({
        success: true,
        message: `Dry run completed. Check logs for items that would be cleaned up after ${retentionDays} days.`,
        dryRun: true,
        timestamp: new Date().toISOString()
      })
    } else {
      // Actually perform cleanup (implement with extreme caution)
      return NextResponse.json({
        success: false,
        message: 'Permanent deletion not implemented yet - requires additional safety measures',
        timestamp: new Date().toISOString()
      }, { status: 501 })
    }

  } catch (error) {
    console.error('Cleanup operation failed:', error)
    return NextResponse.json(
      { error: 'Cleanup operation failed' },
      { status: 500 }
    )
  }
}

// GET - Get cleanup statistics
export async function GET(request: NextRequest) {
  // Check admin permissions
  const authResult = await requirePermissions(request, [Permission.ADMIN_SYSTEM])
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const retentionDays = parseInt(searchParams.get('retentionDays') || '90')

    // Get counts of items that would be cleaned up
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const [deletedUsers, deprecatedModels, cancelledSubscriptions] = await Promise.all([
      softDeleteService.getSoftDeletedUsers(1000),
      softDeleteService.getDeprecatedModels(1000),
      softDeleteService.getCancelledSubscriptions(1000)
    ])

    // Filter by cutoff date
    const oldDeletedUsers = deletedUsers.filter(u => 
      u.updatedAt && new Date(u.updatedAt) < cutoffDate
    )

    const oldDeprecatedModels = deprecatedModels.filter(m => 
      m.updatedAt && new Date(m.updatedAt) < cutoffDate
    )

    const oldCancelledSubscriptions = cancelledSubscriptions.filter(s => 
      s.updatedAt && new Date(s.updatedAt) < cutoffDate
    )

    return NextResponse.json({
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      summary: {
        oldDeletedUsers: {
          count: oldDeletedUsers.length,
          oldestDate: oldDeletedUsers.length > 0 ? 
            Math.min(...oldDeletedUsers.map(u => new Date(u.updatedAt!).getTime())) : null
        },
        oldDeprecatedModels: {
          count: oldDeprecatedModels.length,
          oldestDate: oldDeprecatedModels.length > 0 ? 
            Math.min(...oldDeprecatedModels.map(m => new Date(m.updatedAt!).getTime())) : null
        },
        oldCancelledSubscriptions: {
          count: oldCancelledSubscriptions.length,
          oldestDate: oldCancelledSubscriptions.length > 0 ? 
            Math.min(...oldCancelledSubscriptions.map(s => new Date(s.updatedAt!).getTime())) : null
        }
      },
      items: {
        users: oldDeletedUsers.slice(0, 10), // Sample of items
        models: oldDeprecatedModels.slice(0, 10),
        subscriptions: oldCancelledSubscriptions.slice(0, 10)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to get cleanup statistics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cleanup statistics' },
      { status: 500 }
    )
  }
} 