import { Request } from 'express';
import { prisma } from '../index';
import { redis } from '../index';

// Audit log levels
export enum AuditLogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Audit log categories
export enum AuditLogCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  ORDER_MANAGEMENT = 'ORDER_MANAGEMENT',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  DATA_ACCESS = 'DATA_ACCESS',
  SYSTEM_CONFIGURATION = 'SYSTEM_CONFIGURATION',
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',
  USER_ACTIVITY = 'USER_ACTIVITY',
}

// Audit log entry interface
export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  level: AuditLogLevel;
  category: AuditLogCategory;
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
  requestId?: string;
}

// Audit logger class
class AuditLogger {
  private logQueue: AuditLogEntry[] = [];
  private batchSize = 50;
  private flushInterval = 10000; // 10 seconds
  private isProcessing = false;

  constructor() {
    // Set up periodic flush
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Handle process exit
    process.on('beforeExit', () => {
      this.flushLogs();
    });
  }

  // Log an audit entry
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Add to queue
    this.logQueue.push(fullEntry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [AUDIT] ${fullEntry.level} ${fullEntry.category}: ${fullEntry.action}`, {
        userId: fullEntry.userId,
        success: fullEntry.success,
        details: fullEntry.details,
      });
    }

    // Store in Redis for immediate access
    try {
      await redis.setEx(
        `audit_log:${fullEntry.id}`,
        3600, // 1 hour TTL
        JSON.stringify(fullEntry)
      );
    } catch (error) {
      console.error('Failed to store audit log in Redis:', error);
    }

    // Flush if queue is full
    if (this.logQueue.length >= this.batchSize) {
      this.flushLogs();
    }
  }

  // Flush logs to persistent storage
  private async flushLogs(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      // Store in database (implement AuditLog model if needed)
      // await prisma.auditLog.createMany({
      //   data: logsToFlush,
      //   skipDuplicates: true,
      // });

      // For now, store in files or external logging service
      await this.persistToFile(logsToFlush);

      console.log(`📝 Flushed ${logsToFlush.length} audit logs`);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Put logs back in queue for retry
      this.logQueue.unshift(...logsToFlush);
    } finally {
      this.isProcessing = false;
    }
  }

  // Persist logs to file system
  private async persistToFile(logs: AuditLogEntry[]): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const logDir = path.join(process.cwd(), 'logs', 'audit');
      await fs.mkdir(logDir, { recursive: true });

      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `audit-${today}.jsonl`);

      const logLines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
      await fs.appendFile(logFile, logLines);
    } catch (error) {
      console.error('Failed to persist audit logs to file:', error);
      throw error;
    }
  }

  // Get recent audit logs
  async getRecentLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const keys = await redis.keys('audit_log:*');
      const recentKeys = keys.slice(-limit);
      
      if (recentKeys.length === 0) {
        return [];
      }

      const logs = await redis.mGet(recentKeys);
      return logs
        .filter(log => log !== null)
        .map(log => JSON.parse(log!))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to retrieve recent audit logs:', error);
      return [];
    }
  }

  // Search audit logs
  async searchLogs(criteria: Partial<AuditLogEntry>): Promise<AuditLogEntry[]> {
    try {
      const recentLogs = await this.getRecentLogs(1000);
      
      return recentLogs.filter(log => {
        return Object.entries(criteria).every(([key, value]) => {
          if (value === undefined) return true;
          return log[key as keyof AuditLogEntry] === value;
        });
      });
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      return [];
    }
  }
}

// Singleton audit logger instance
export const auditLogger = new AuditLogger();

// Helper functions for common audit operations
export const auditHelpers = {
  // Extract request information
  extractRequestInfo(req: Request & { user?: any; requestId?: string }): Partial<AuditLogEntry> {
    return {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      sessionId: (req as any).sessionID || undefined,
      requestId: req.requestId,
    };
  },

  // Log authentication events
  async logAuthentication(req: Request & { user?: any }, action: string, success: boolean, details: Record<string, any> = {}): Promise<void> {
    await auditLogger.log({
      ...auditHelpers.extractRequestInfo(req),
      level: success ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
      category: AuditLogCategory.AUTHENTICATION,
      action,
      success,
      details,
    });
  },

  // Log order operations
  async logOrderOperation(req: Request & { user?: any }, action: string, orderId?: string, success: boolean = true, details: Record<string, any> = {}): Promise<void> {
    await auditLogger.log({
      ...auditHelpers.extractRequestInfo(req),
      level: success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
      category: AuditLogCategory.ORDER_MANAGEMENT,
      action,
      resourceType: 'ORDER',
      resourceId: orderId,
      success,
      details,
    });
  },

  // Log payment operations
  async logPaymentOperation(req: Request & { user?: any }, action: string, paymentId?: string, success: boolean = true, details: Record<string, any> = {}): Promise<void> {
    await auditLogger.log({
      ...auditHelpers.extractRequestInfo(req),
      level: success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
      category: AuditLogCategory.PAYMENT_PROCESSING,
      action,
      resourceType: 'PAYMENT',
      resourceId: paymentId,
      success,
      details: {
        ...details,
        // Remove sensitive payment data
        paymentMethod: details.paymentMethod,
        amount: details.amount,
        currency: details.currency,
      },
    });
  },

  // Log security incidents
  async logSecurityIncident(req: Request & { user?: any }, incident: string, severity: AuditLogLevel = AuditLogLevel.WARNING, details: Record<string, any> = {}): Promise<void> {
    await auditLogger.log({
      ...auditHelpers.extractRequestInfo(req),
      level: severity,
      category: AuditLogCategory.SECURITY_INCIDENT,
      action: incident,
      success: false,
      details,
    });
  },

  // Log data access
  async logDataAccess(req: Request & { user?: any }, resource: string, resourceId?: string, action: string = 'READ', success: boolean = true): Promise<void> {
    await auditLogger.log({
      ...auditHelpers.extractRequestInfo(req),
      level: AuditLogLevel.INFO,
      category: AuditLogCategory.DATA_ACCESS,
      action: `${action.toUpperCase()}_${resource.toUpperCase()}`,
      resourceType: resource,
      resourceId,
      success,
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
      },
    });
  },

  // Log user activity
  async logUserActivity(req: Request & { user?: any }, activity: string, details: Record<string, any> = {}): Promise<void> {
    await auditLogger.log({
      ...auditHelpers.extractRequestInfo(req),
      level: AuditLogLevel.INFO,
      category: AuditLogCategory.USER_ACTIVITY,
      action: activity,
      success: true,
      details,
    });
  },
};

// Middleware to automatically log API requests
export const auditMiddleware = (req: Request & { user?: any; requestId?: string }, res: any, next: any) => {
  // Generate request ID if not present
  if (!req.requestId) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log request
  const startTime = Date.now();
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode < 400;
    
    // Log the API call
    auditHelpers.logDataAccess(
      req,
      'API',
      req.path,
      req.method,
      success
    ).catch(error => {
      console.error('Failed to log API call:', error);
    });

    // Log additional details for sensitive operations
    if (req.path.includes('/orders') || req.path.includes('/payments')) {
      auditLogger.log({
        ...auditHelpers.extractRequestInfo(req),
        level: success ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
        category: AuditLogCategory.USER_ACTIVITY,
        action: `${req.method}_${req.path}`,
        success,
        details: {
          statusCode: res.statusCode,
          responseTime,
          bodySize: JSON.stringify(body).length,
        },
      }).catch(error => {
        console.error('Failed to log detailed audit:', error);
      });
    }

    return originalJson.call(this, body);
  };

  next();
};

export default auditLogger;