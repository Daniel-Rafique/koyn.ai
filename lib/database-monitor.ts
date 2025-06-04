import { prisma } from './database'

export interface DatabaseMetrics {
  connectionCount: number
  activeQueries: number
  avgQueryTime: number
  slowQueries: number
  errorRate: number
  uptime: number
  lastHealthCheck: Date
}

export interface QueryPerformanceLog {
  query: string
  duration: number
  timestamp: Date
  success: boolean
  error?: string
}

class DatabaseMonitor {
  private metrics: DatabaseMetrics = {
    connectionCount: 0,
    activeQueries: 0,
    avgQueryTime: 0,
    slowQueries: 0,
    errorRate: 0,
    uptime: 0,
    lastHealthCheck: new Date()
  }

  private queryLogs: QueryPerformanceLog[] = []
  private readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second
  private readonly MAX_LOG_SIZE = 1000
  private startTime = Date.now()

  // Health check
  async checkDatabaseHealth(): Promise<{
    healthy: boolean
    metrics: DatabaseMetrics
    issues?: string[]
  }> {
    const issues: string[] = []
    
    try {
      const startTime = Date.now()
      
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`
      
      const queryTime = Date.now() - startTime
      
      // Test database operations
      const userCount = await prisma.user.count()
      const modelCount = await prisma.model.count()
      
      // Update metrics
      this.metrics.lastHealthCheck = new Date()
      this.metrics.uptime = Date.now() - this.startTime
      
      // Check for issues
      if (queryTime > this.SLOW_QUERY_THRESHOLD) {
        issues.push(`Slow response time: ${queryTime}ms`)
      }
      
      if (this.metrics.errorRate > 5) {
        issues.push(`High error rate: ${this.metrics.errorRate}%`)
      }
      
      if (this.metrics.slowQueries > 10) {
        issues.push(`Too many slow queries: ${this.metrics.slowQueries}`)
      }

      console.log(`🔍 Database Health Check: ${issues.length === 0 ? '✅ Healthy' : '⚠️ Issues Found'}`)
      console.log(`📊 Users: ${userCount}, Models: ${modelCount}, Query Time: ${queryTime}ms`)

      return {
        healthy: issues.length === 0,
        metrics: { ...this.metrics },
        issues: issues.length > 0 ? issues : undefined
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      issues.push(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        healthy: false,
        metrics: { ...this.metrics },
        issues
      }
    }
  }

  // Log query performance
  logQuery(query: string, duration: number, success: boolean, error?: string) {
    const log: QueryPerformanceLog = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
      success,
      error
    }

    this.queryLogs.push(log)
    
    // Keep only recent logs
    if (this.queryLogs.length > this.MAX_LOG_SIZE) {
      this.queryLogs = this.queryLogs.slice(-this.MAX_LOG_SIZE)
    }

    // Update metrics
    this.updateMetrics(log)
  }

  private updateMetrics(log: QueryPerformanceLog) {
    // Update average query time
    const recentLogs = this.queryLogs.slice(-100)
    this.metrics.avgQueryTime = recentLogs.reduce((sum, l) => sum + l.duration, 0) / recentLogs.length

    // Count slow queries
    this.metrics.slowQueries = recentLogs.filter(l => l.duration > this.SLOW_QUERY_THRESHOLD).length

    // Calculate error rate
    const errors = recentLogs.filter(l => !l.success).length
    this.metrics.errorRate = (errors / recentLogs.length) * 100
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from query logs
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/email\s*=\s*'[^']*'/gi, "email='***'")
      .substring(0, 200) // Limit query length
  }

  // Get recent slow queries
  getSlowQueries(limit = 10): QueryPerformanceLog[] {
    return this.queryLogs
      .filter(log => log.duration > this.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  // Get error logs
  getErrorLogs(limit = 10): QueryPerformanceLog[] {
    return this.queryLogs
      .filter(log => !log.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get current metrics
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics }
  }

  // Reset metrics
  resetMetrics() {
    this.queryLogs = []
    this.metrics = {
      connectionCount: 0,
      activeQueries: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      errorRate: 0,
      uptime: Date.now() - this.startTime,
      lastHealthCheck: new Date()
    }
  }
}

// Singleton instance
export const databaseMonitor = new DatabaseMonitor()

// Prisma middleware for automatic query logging
export function setupDatabaseMonitoring() {
  prisma.$use(async (params, next) => {
    const start = Date.now()
    
    try {
      const result = await next(params)
      const duration = Date.now() - start
      
      databaseMonitor.logQuery(
        `${params.model}.${params.action}`,
        duration,
        true
      )
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      databaseMonitor.logQuery(
        `${params.model}.${params.action}`,
        duration,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      throw error
    }
  })

  // Run health checks every 5 minutes
  setInterval(async () => {
    await databaseMonitor.checkDatabaseHealth()
  }, 5 * 60 * 1000)

  console.log('🔍 Database monitoring initialized')
}

// Database connection pool monitoring
export async function getConnectionPoolStatus() {
  try {
    // This would need to be customized based on your database setup
    const poolInfo = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as any[]

    return {
      totalConnections: Number(poolInfo[0]?.total_connections || 0),
      activeConnections: Number(poolInfo[0]?.active_connections || 0),
      idleConnections: Number(poolInfo[0]?.idle_connections || 0)
    }
  } catch (error) {
    console.error('Failed to get connection pool status:', error)
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0
    }
  }
}

// Database size monitoring
export async function getDatabaseSize() {
  try {
    const result = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    ` as any[]

    return result[0]?.size || 'Unknown'
  } catch (error) {
    console.error('Failed to get database size:', error)
    return 'Unknown'
  }
}

// Table sizes
export async function getTableSizes() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    ` as any[]

    return result.map(row => ({
      table: row.tablename,
      size: row.size,
      bytes: Number(row.bytes)
    }))
  } catch (error) {
    console.error('Failed to get table sizes:', error)
    return []
  }
} 