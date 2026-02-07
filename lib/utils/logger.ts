// Production logging with severity levels and structured output
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogContext = Record<string, any>

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  userId?: string
  sessionId?: string
  requestId?: string
  ip?: string
  userAgent?: string
}

class Logger {
  private static instance: Logger
  private minLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  private isDevelopment = process.env.NODE_ENV !== 'production'

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4
    }
    return levels[level] >= levels[this.minLevel]
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = entry.level.toUpperCase().padEnd(8)
    const message = entry.message
    
    let formatted = `[${timestamp}] ${level} ${message}`
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(entry.context)}`
    }
    
    if (entry.userId) {
      formatted += ` | User: ${entry.userId}`
    }
    
    if (entry.requestId) {
      formatted += ` | Request: ${entry.requestId}`
    }
    
    return formatted
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // In production, send to external logging service (LogRocket, Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to logging endpoint
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      } catch (error) {
        // Fallback to console if external logging fails
        console.error('Failed to send log to external service:', error)
      }
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, metadata?: {
    userId?: string
    sessionId?: string
    requestId?: string
    ip?: string
    userAgent?: string
  }) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...metadata
    }

    // Format and output
    const formatted = this.formatLog(entry)
    
    switch (level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
      case 'critical':
        console.error('🔥 CRITICAL:', formatted)
        break
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production' && level !== 'debug') {
      this.sendToExternalService(entry).catch(() => {
        // Silent fail for logging errors
      })
    }
  }

  // Public API
  debug(message: string, context?: LogContext, metadata?: any) {
    this.log('debug', message, context, metadata)
  }

  info(message: string, context?: LogContext, metadata?: any) {
    this.log('info', message, context, metadata)
  }

  warn(message: string, context?: LogContext, metadata?: any) {
    this.log('warn', message, context, metadata)
  }

  error(message: string, context?: LogContext, metadata?: any) {
    this.log('error', message, context, metadata)
  }

  critical(message: string, context?: LogContext, metadata?: any) {
    this.log('critical', message, context, metadata)
  }

  // Security event logging
  securityEvent(event: string, details: Record<string, any>) {
    this.log('info', `Security Event: ${event}`, details, {
      category: 'security'
    })
  }

  // Performance logging
  performance(method: string, duration: number, metadata?: any) {
    this.log('info', `Performance: ${method} took ${duration}ms`, { duration }, {
      category: 'performance',
      ...metadata
    })
  }

  // Database query logging
  query(query: string, duration: number, metadata?: any) {
    if (duration > 1000) { // Log slow queries
      this.log('warn', `Slow Query: ${query} (${duration}ms)`, { duration }, {
        category: 'database',
        ...metadata
      })
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Helper functions
export function logError(context: string, message: string, error: any) {
  logger.error(message, { context, error: error?.message || error })
}

export function logSecurityEvent(event: string, details: Record<string, any>) {
  logger.securityEvent(event, details)
}

export function logInfo(context: string, message: string, metadata?: any) {
  logger.info(message, { context }, metadata)
}

export default logger