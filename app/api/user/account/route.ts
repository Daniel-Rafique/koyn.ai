import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { softDeleteService } from '@/lib/soft-delete'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

// GET - Export user data (GDPR compliance)
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch complete user data for export
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        creatorProfile: true,
        subscriptions: {
          include: {
            plan: true
          }
        },
        orders: {
          include: {
            items: true
          }
        },
        reviews: true,
        discussions: true,
        apiKeys: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            lastUsed: true,
            // Don't include the actual key for security
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove sensitive fields
    const { password: _password, ...exportData } = userData

    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        userData: exportData
      },
      message: 'User data exported successfully'
    })

  } catch (error) {
    console.error('Error exporting user data:', error)
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    )
  }
}

async function accountActionHandler(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, reason } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        type: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'deactivate':
        // Soft delete user account
        const success = await softDeleteService.softDeleteUser(user.id, user.id)
        
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to deactivate account' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Account deactivated successfully. You can reactivate it by contacting support within 30 days.'
        })

      case 'reactivate':
        return NextResponse.json(
          { error: 'Account reactivation requires manual review. Please contact support.' },
          { status: 400 }
        )

      case 'delete_permanently':
        // This is a dangerous operation - requires additional confirmation
        if (!body.confirmDelete || body.confirmDelete !== 'DELETE_MY_ACCOUNT_PERMANENTLY') {
          return NextResponse.json(
            { error: 'Permanent deletion requires confirmation. Please provide confirmDelete: "DELETE_MY_ACCOUNT_PERMANENTLY"' },
            { status: 400 }
          )
        }

        // Check if user has active subscriptions
        const activeSubscriptions = await prisma.subscription.count({
          where: {
            userId: user.id,
            status: 'ACTIVE'
          }
        })

        if (activeSubscriptions > 0) {
          return NextResponse.json(
            { error: 'Cannot permanently delete account with active subscriptions. Please cancel all subscriptions first.' },
            { status: 400 }
          )
        }

        // Log the deletion request
        console.log(`Permanent deletion requested for user: ${user.email}, reason: ${reason}`)

        // For now, we'll use the soft delete service for safety
        const deleteSuccess = await softDeleteService.softDeleteUser(user.id, user.id)

        if (!deleteSuccess) {
          return NextResponse.json(
            { error: 'Failed to process deletion request' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Permanent deletion request submitted. Our team will process this within 7 business days and send you a confirmation email.'
        })

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error processing account action:', error)
    return NextResponse.json(
      { error: 'Failed to process account action' },
      { status: 500 }
    )
  }
}

// Export with rate limiting to prevent abuse
export const POST = withRateLimit(rateLimiters.general, accountActionHandler) 