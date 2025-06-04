import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './database'

// User roles from Prisma schema
export enum UserRole {
  CONSUMER = 'CONSUMER',
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN'
}

// Define permissions for different actions
export enum Permission {
  // Model permissions
  MODELS_READ = 'models:read',
  MODELS_CREATE = 'models:create',
  MODELS_UPDATE = 'models:update',
  MODELS_DELETE = 'models:delete',
  MODELS_PUBLISH = 'models:publish',
  
  // Inference permissions
  INFERENCE_RUN = 'inference:run',
  INFERENCE_BATCH = 'inference:batch',
  
  // User management
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  
  // Creator profile
  PROFILE_READ = 'profile:read',
  PROFILE_UPDATE = 'profile:update',
  PROFILE_VERIFY = 'profile:verify',
  
  // Subscription management
  SUBSCRIPTIONS_READ = 'subscriptions:read',
  SUBSCRIPTIONS_CREATE = 'subscriptions:create',
  SUBSCRIPTIONS_CANCEL = 'subscriptions:cancel',
  
  // Analytics and reporting
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // Admin functions
  ADMIN_USERS = 'admin:users',
  ADMIN_MODELS = 'admin:models',
  ADMIN_SYSTEM = 'admin:system'
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CONSUMER]: [
    Permission.MODELS_READ,
    Permission.INFERENCE_RUN,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.SUBSCRIPTIONS_READ,
    Permission.SUBSCRIPTIONS_CREATE,
    Permission.SUBSCRIPTIONS_CANCEL
  ],
  
  [UserRole.CREATOR]: [], // Will be populated below to avoid circular reference
  
  [UserRole.ADMIN]: [
    // All permissions
    ...Object.values(Permission)
  ]
}

// Initialize creator permissions (avoid circular reference)
ROLE_PERMISSIONS[UserRole.CREATOR] = [
  Permission.MODELS_READ,
  Permission.INFERENCE_RUN,
  Permission.PROFILE_READ,
  Permission.PROFILE_UPDATE,
  Permission.SUBSCRIPTIONS_READ,
  Permission.SUBSCRIPTIONS_CREATE,
  Permission.SUBSCRIPTIONS_CANCEL,
  Permission.MODELS_CREATE,
  Permission.MODELS_UPDATE,
  Permission.MODELS_PUBLISH,
  Permission.INFERENCE_BATCH,
  Permission.ANALYTICS_READ
]

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions.includes(permission)
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Check if user has all specified permissions
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Get user session with role information
export async function getUserSession() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return null
    }

    // Get user with role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        avatar: true,
        emailVerified: true,
        creatorProfile: {
          select: {
            verified: true,
            rating: true,
            totalEarnings: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    return {
      ...session,
      user: {
        ...session.user,
        role: user.type as UserRole,
        emailVerified: !!user.emailVerified,
        creatorVerified: !!user.creatorProfile?.verified,
        creatorRating: user.creatorProfile?.rating || 0
      }
    }
  } catch (error) {
    console.error('Error getting user session:', error)
    return null
  }
}

// Middleware to check permissions for API routes
export async function requirePermissions(
  request: Request,
  requiredPermissions: Permission[]
): Promise<{
  authorized: boolean
  userId?: string
  userRole?: UserRole
  error?: string
}> {
  try {
    const session = await getUserSession()
    
    if (!session?.user) {
      return { 
        authorized: false, 
        error: 'Authentication required' 
      }
    }

    const userRole = session.user.role
    
    if (!hasAllPermissions(userRole, requiredPermissions)) {
      return { 
        authorized: false, 
        error: 'Insufficient permissions' 
      }
    }

    return {
      authorized: true,
      userId: session.user.id,
      userRole
    }
  } catch (error) {
    console.error('Permission check error:', error)
    return { 
      authorized: false, 
      error: 'Permission check failed' 
    }
  }
}

// Resource ownership check
export async function checkResourceOwnership(
  userId: string,
  resourceType: 'model' | 'subscription' | 'profile',
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'model':
        const model = await prisma.model.findFirst({
          where: { id: resourceId, creatorId: userId }
        })
        return !!model
        
      case 'subscription':
        const subscription = await prisma.subscription.findFirst({
          where: { id: resourceId, userId }
        })
        return !!subscription
        
      case 'profile':
        const profile = await prisma.creatorProfile.findFirst({
          where: { id: resourceId, userId }
        })
        return !!profile
        
      default:
        return false
    }
  } catch (error) {
    console.error('Ownership check error:', error)
    return false
  }
}

// Combined permission and ownership check
export async function requirePermissionAndOwnership(
  request: Request,
  requiredPermissions: Permission[],
  resourceType: 'model' | 'subscription' | 'profile',
  resourceId: string
): Promise<{
  authorized: boolean
  userId?: string
  userRole?: UserRole
  error?: string
}> {
  const permissionCheck = await requirePermissions(request, requiredPermissions)
  
  if (!permissionCheck.authorized || !permissionCheck.userId) {
    return permissionCheck
  }

  // Admin users bypass ownership checks
  if (permissionCheck.userRole === UserRole.ADMIN) {
    return permissionCheck
  }

  const ownsResource = await checkResourceOwnership(
    permissionCheck.userId,
    resourceType,
    resourceId
  )

  if (!ownsResource) {
    return {
      authorized: false,
      error: 'Resource not found or access denied'
    }
  }

  return permissionCheck
}

// Helper functions for common permission checks
export const PermissionChecks = {
  canReadModels: (role: UserRole) => hasPermission(role, Permission.MODELS_READ),
  canCreateModels: (role: UserRole) => hasPermission(role, Permission.MODELS_CREATE),
  canRunInference: (role: UserRole) => hasPermission(role, Permission.INFERENCE_RUN),
  canManageUsers: (role: UserRole) => hasPermission(role, Permission.ADMIN_USERS),
  canVerifyCreators: (role: UserRole) => hasPermission(role, Permission.PROFILE_VERIFY),
  isAdmin: (role: UserRole) => role === UserRole.ADMIN,
  isCreator: (role: UserRole) => role === UserRole.CREATOR || role === UserRole.ADMIN,
  isConsumer: (role: UserRole) => role === UserRole.CONSUMER
} 