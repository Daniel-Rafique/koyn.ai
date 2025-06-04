import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions, Permission } from '@/lib/rbac'
import { 
  databaseMonitor, 
  getConnectionPoolStatus, 
  getDatabaseSize, 
  getTableSizes 
} from '@/lib/database-monitor'

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
    // Get comprehensive database health data
    const [
      healthCheck,
      connectionPool,
      databaseSize,
      tableSizes,
      slowQueries,
      errorLogs
    ] = await Promise.all([
      databaseMonitor.checkDatabaseHealth(),
      getConnectionPoolStatus(),
      getDatabaseSize(),
      getTableSizes(),
      databaseMonitor.getSlowQueries(5),
      databaseMonitor.getErrorLogs(5)
    ])

    const response = {
      timestamp: new Date().toISOString(),
      health: healthCheck,
      connectionPool,
      database: {
        size: databaseSize,
        tables: tableSizes
      },
      performance: {
        slowQueries,
        errorLogs,
        metrics: databaseMonitor.getMetrics()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Database health check API error:', error)
    return NextResponse.json(
      { error: 'Failed to get database health status' },
      { status: 500 }
    )
  }
} 