import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions, Permission } from '@/lib/rbac'
import { softDeleteService } from '@/lib/soft-delete'

// GET - List soft deleted items
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
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    const result: {
      timestamp: string;
      deletedItems: {
        users?: unknown[];
        models?: unknown[];
        subscriptions?: unknown[];
      }
    } = {
      timestamp: new Date().toISOString(),
      deletedItems: {}
    }

    // Get different types of soft deleted items
    if (type === 'all' || type === 'users') {
      result.deletedItems.users = await softDeleteService.getSoftDeletedUsers(limit)
    }

    if (type === 'all' || type === 'models') {
      result.deletedItems.models = await softDeleteService.getDeprecatedModels(limit)
    }

    if (type === 'all' || type === 'subscriptions') {
      result.deletedItems.subscriptions = await softDeleteService.getCancelledSubscriptions(limit)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get soft deleted items:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve soft deleted items' },
      { status: 500 }
    )
  }
}

// POST - Perform soft delete operations
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
    const { action, type, id } = body

    if (!action || !type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: action, type, id' },
        { status: 400 }
      )
    }

    const adminUserId = authResult.userId!

    let success = false
    let message = ''

    switch (action) {
      case 'delete':
        switch (type) {
          case 'user':
            success = await softDeleteService.softDeleteUser(id, adminUserId)
            message = success ? `User ${id} soft deleted` : `Failed to soft delete user ${id}`
            break
          case 'model':
            success = await softDeleteService.softDeleteModel(id, adminUserId)
            message = success ? `Model ${id} soft deleted` : `Failed to soft delete model ${id}`
            break
          case 'subscription':
            success = await softDeleteService.softDeleteSubscription(id, adminUserId)
            message = success ? `Subscription ${id} cancelled` : `Failed to cancel subscription ${id}`
            break
          case 'review':
            success = await softDeleteService.softDeleteReview(id, adminUserId)
            message = success ? `Review ${id} soft deleted` : `Failed to soft delete review ${id}`
            break
          case 'discussion':
            success = await softDeleteService.softDeleteDiscussion(id, adminUserId)
            message = success ? `Discussion ${id} soft deleted` : `Failed to soft delete discussion ${id}`
            break
          default:
            return NextResponse.json(
              { error: `Unsupported type: ${type}` },
              { status: 400 }
            )
        }
        break

      case 'restore':
        // Currently only user restoration is partially implemented
        if (type === 'user') {
          success = await softDeleteService.restoreUser(id, adminUserId)
          message = success ? `User ${id} restored` : `User ${id} requires manual restoration`
        } else {
          return NextResponse.json(
            { error: 'Restoration not yet implemented for this type' },
            { status: 501 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success,
      message,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Soft delete operation failed:', error)
    return NextResponse.json(
      { error: 'Soft delete operation failed' },
      { status: 500 }
    )
  }
} 