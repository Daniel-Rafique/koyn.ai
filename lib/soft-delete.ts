import { prisma } from './database'

// Soft delete interface for models that support it
export interface SoftDeletable {
  id: string
  deletedAt?: Date | null
  deletedBy?: string | null
}

// Soft delete utilities for different models
export class SoftDeleteService {
  
  // User soft delete
  async softDeleteUser(userId: string, deletedBy: string): Promise<boolean> {
    try {
      // Mark user as deleted but keep record for data integrity
      await prisma.user.update({
        where: { id: userId },
        data: {
          // Anonymize sensitive data
          email: `deleted_user_${userId}@deleted.local`,
          name: `[Deleted User]`,
          avatar: null,
          password: null,
          updatedAt: new Date()
        }
      })

      // Soft delete creator profile if exists
      const creatorProfile = await prisma.creatorProfile.findUnique({
        where: { userId }
      })

      if (creatorProfile) {
        await this.softDeleteCreatorProfile(creatorProfile.id, deletedBy)
      }

      // Mark subscriptions as cancelled
      await prisma.subscription.updateMany({
        where: { userId },
        data: { 
          status: 'CANCELLED'
        }
      })

      // Deactivate API keys
      await prisma.aPIKey.updateMany({
        where: { userId },
        data: { 
          isActive: false
        }
      })

      console.log(`✅ User ${userId} soft deleted by ${deletedBy}`)
      return true
    } catch (error) {
      console.error(`Failed to soft delete user ${userId}:`, error)
      return false
    }
  }

  // Creator profile soft delete
  async softDeleteCreatorProfile(profileId: string, deletedBy: string): Promise<boolean> {
    try {
      await prisma.creatorProfile.update({
        where: { id: profileId },
        data: {
          displayName: '[Deleted Creator]',
          bio: null,
          website: null,
          github: null,
          twitter: null,
          linkedin: null,
          verified: false
        }
      })

      // Mark models as deprecated but keep them for data integrity
      await prisma.model.updateMany({
        where: { creatorId: profileId },
        data: { 
          status: 'DEPRECATED'
        }
      })

      console.log(`✅ Creator profile ${profileId} soft deleted by ${deletedBy}`)
      return true
    } catch (error) {
      console.error(`Failed to soft delete creator profile ${profileId}:`, error)
      return false
    }
  }

  // Model soft delete
  async softDeleteModel(modelId: string, deletedBy: string): Promise<boolean> {
    try {
      await prisma.model.update({
        where: { id: modelId },
        data: {
          status: 'DEPRECATED',
          updatedAt: new Date()
        }
      })

      // Cancel active subscriptions for this model
      await prisma.subscription.updateMany({
        where: { 
          modelId,
          status: 'ACTIVE'
        },
        data: { 
          status: 'CANCELLED'
        }
      })

      // Deactivate pricing plans
      await prisma.pricingPlan.updateMany({
        where: { modelId },
        data: { 
          active: false
        }
      })

      console.log(`✅ Model ${modelId} soft deleted by ${deletedBy}`)
      return true
    } catch (error) {
      console.error(`Failed to soft delete model ${modelId}:`, error)
      return false
    }
  }

  // Subscription soft delete (cancellation)
  async softDeleteSubscription(subscriptionId: string, deletedBy: string): Promise<boolean> {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      })

      console.log(`✅ Subscription ${subscriptionId} soft deleted by ${deletedBy}`)
      return true
    } catch (error) {
      console.error(`Failed to soft delete subscription ${subscriptionId}:`, error)
      return false
    }
  }

  // Review soft delete
  async softDeleteReview(reviewId: string, deletedBy: string): Promise<boolean> {
    try {
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          content: '[This review has been removed]',
          title: '[Removed]',
          reported: true,
          updatedAt: new Date()
        }
      })

      console.log(`✅ Review ${reviewId} soft deleted by ${deletedBy}`)
      return true
    } catch (error) {
      console.error(`Failed to soft delete review ${reviewId}:`, error)
      return false
    }
  }

  // Discussion soft delete
  async softDeleteDiscussion(discussionId: string, deletedBy: string): Promise<boolean> {
    try {
      await prisma.discussion.update({
        where: { id: discussionId },
        data: {
          title: '[Removed Discussion]',
          content: '[This discussion has been removed]',
          updatedAt: new Date()
        }
      })

      // Also soft delete replies
      await prisma.discussionReply.updateMany({
        where: { discussionId },
        data: {
          content: '[This reply has been removed]'
        }
      })

      console.log(`✅ Discussion ${discussionId} soft deleted by ${deletedBy}`)
      return true
    } catch (error) {
      console.error(`Failed to soft delete discussion ${discussionId}:`, error)
      return false
    }
  }

  // Restore soft deleted user
  async restoreUser(userId: string, restoredBy: string): Promise<boolean> {
    try {
      // This is a placeholder - in practice you'd need to store original data
      // to properly restore. For now, we just reactivate the account
      
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user || !user.email.includes('deleted_user_')) {
        throw new Error('User is not soft deleted or does not exist')
      }

      // Note: You'd need to implement proper data restoration
      // This is a simplified version
      console.log(`⚠️ User ${userId} restore attempted by ${restoredBy} - requires manual data restoration`)
      return false // Return false to indicate manual intervention needed
    } catch (error) {
      console.error(`Failed to restore user ${userId}:`, error)
      return false
    }
  }

  // Get soft deleted items for admin review
  async getSoftDeletedUsers(limit = 50): Promise<any[]> {
    return prisma.user.findMany({
      where: {
        email: {
          contains: 'deleted_user_'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        updatedAt: true
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })
  }

  async getDeprecatedModels(limit = 50): Promise<any[]> {
    return prisma.model.findMany({
      where: {
        status: 'DEPRECATED'
      },
      include: {
        creator: true
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })
  }

  async getCancelledSubscriptions(limit = 50): Promise<any[]> {
    return prisma.subscription.findMany({
      where: {
        status: 'CANCELLED'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        model: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })
  }

  // Cleanup old soft deleted data (after retention period)
  async cleanupOldDeletedData(retentionDays = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    try {
      // Clean up old deleted users (be very careful with this)
      const oldDeletedUsers = await prisma.user.findMany({
        where: {
          email: { contains: 'deleted_user_' },
          updatedAt: { lt: cutoffDate }
        }
      })

      console.log(`🗑️ Found ${oldDeletedUsers.length} old deleted users past retention period`)
      
      // For now, just log - implement actual cleanup with admin approval
      for (const user of oldDeletedUsers) {
        console.log(`⚠️ User ${user.id} (${user.email}) eligible for permanent deletion`)
      }
      
    } catch (error) {
      console.error('Failed to cleanup old deleted data:', error)
    }
  }
}

// Singleton instance
export const softDeleteService = new SoftDeleteService()

// Helper functions for common soft delete operations
export const softDelete = {
  user: (userId: string, deletedBy: string) => 
    softDeleteService.softDeleteUser(userId, deletedBy),
  
  model: (modelId: string, deletedBy: string) => 
    softDeleteService.softDeleteModel(modelId, deletedBy),
  
  subscription: (subscriptionId: string, deletedBy: string) => 
    softDeleteService.softDeleteSubscription(subscriptionId, deletedBy),
  
  review: (reviewId: string, deletedBy: string) => 
    softDeleteService.softDeleteReview(reviewId, deletedBy),
  
  discussion: (discussionId: string, deletedBy: string) => 
    softDeleteService.softDeleteDiscussion(discussionId, deletedBy)
} 