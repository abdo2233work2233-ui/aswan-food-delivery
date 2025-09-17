import { prisma } from '../index';
import { redis } from '../index';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { auditHelpers } from './auditService';
import paymentService from './paymentService';

// Error recovery and retry service
export class ErrorRecoveryService {
  
  // Retry configuration
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 3000, 9000]; // Exponential backoff
  private static readonly QUEUE_KEY = 'failed_operations';
  
  // Operation types that can be retried
  private static readonly RETRYABLE_OPERATIONS = {
    ORDER_CREATION: 'order_creation',
    PAYMENT_PROCESSING: 'payment_processing',
    INVENTORY_UPDATE: 'inventory_update',
    NOTIFICATION_SEND: 'notification_send',
    AUDIT_LOG: 'audit_log',
  };

  // Queue failed operation for retry
  static async queueFailedOperation(
    operationType: string,
    operationData: any,
    error: Error,
    context: { userId?: string; orderId?: string; requestId?: string } = {}
  ): Promise<void> {
    try {
      const failedOperation = {
        id: `failed_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: operationType,
        data: operationData,
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
        context,
        attempts: 0,
        maxRetries: this.MAX_RETRIES,
        nextRetryAt: new Date(Date.now() + this.RETRY_DELAYS[0]).toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      await redis.lPush(this.QUEUE_KEY, JSON.stringify(failedOperation));
      
      console.log(`⚠️ Queued failed operation: ${operationType} - ${error.message}`);
      
      // Schedule immediate retry for critical operations
      if (this.isCriticalOperation(operationType)) {
        setTimeout(() => this.processRetryQueue(), 1000);
      }

    } catch (queueError) {
      console.error('Failed to queue failed operation:', queueError);
      // Critical error - log to file or external service
      const typedQueueError = queueError instanceof Error ? queueError : new Error(String(queueError));
      await this.logCriticalError(operationType, operationData, error, typedQueueError);
    }
  }

  // Process retry queue
  static async processRetryQueue(): Promise<void> {
    try {
      const queueLength = await redis.lLen(this.QUEUE_KEY);
      
      if (queueLength === 0) {
        return;
      }

      console.log(`🔄 Processing retry queue: ${queueLength} operations`);

      for (let i = 0; i < Math.min(queueLength, 10); i++) { // Process max 10 at a time
        const operationData = await redis.rPop(this.QUEUE_KEY);
        
        if (operationData) {
          const operation = JSON.parse(operationData);
          
          // Check if it's time to retry
          if (new Date() >= new Date(operation.nextRetryAt)) {
            await this.retryOperation(operation);
          } else {
            // Put back in queue
            await redis.lPush(this.QUEUE_KEY, operationData);
          }
        }
      }

    } catch (error) {
      console.error('Error processing retry queue:', error);
    }
  }

  // Retry a specific operation
  private static async retryOperation(operation: any): Promise<void> {
    try {
      operation.attempts++;
      
      console.log(`🔄 Retrying operation ${operation.id} (attempt ${operation.attempts}/${operation.maxRetries})`);

      let success = false;

      switch (operation.type) {
        case this.RETRYABLE_OPERATIONS.ORDER_CREATION:
          success = await this.retryOrderCreation(operation);
          break;
        case this.RETRYABLE_OPERATIONS.PAYMENT_PROCESSING:
          success = await this.retryPaymentProcessing(operation);
          break;
        case this.RETRYABLE_OPERATIONS.INVENTORY_UPDATE:
          success = await this.retryInventoryUpdate(operation);
          break;
        case this.RETRYABLE_OPERATIONS.NOTIFICATION_SEND:
          success = await this.retryNotificationSend(operation);
          break;
        case this.RETRYABLE_OPERATIONS.AUDIT_LOG:
          success = await this.retryAuditLog(operation);
          break;
        default:
          console.warn(`Unknown operation type: ${operation.type}`);
          success = false;
      }

      if (success) {
        console.log(`✅ Operation ${operation.id} succeeded on retry`);
        operation.status = 'completed';
      } else if (operation.attempts >= operation.maxRetries) {
        console.error(`❌ Operation ${operation.id} failed after ${operation.maxRetries} attempts`);
        operation.status = 'failed';
        await this.handlePermanentFailure(operation);
      } else {
        // Schedule next retry with exponential backoff
        const delay = this.RETRY_DELAYS[Math.min(operation.attempts - 1, this.RETRY_DELAYS.length - 1)];
        operation.nextRetryAt = new Date(Date.now() + delay).toISOString();
        operation.status = 'pending';
        
        // Put back in queue
        await redis.lPush(this.QUEUE_KEY, JSON.stringify(operation));
      }

    } catch (error) {
      console.error(`Error retrying operation ${operation.id}:`, error);
      
      // Put back in queue for later retry
      await redis.lPush(this.QUEUE_KEY, JSON.stringify(operation));
    }
  }

  // Retry order creation
  private static async retryOrderCreation(operation: any): Promise<boolean> {
    try {
      const { orderData, userId } = operation.data;
      
      // Check if order was already created
      const existingOrder = await prisma.order.findFirst({
        where: {
          customerId: userId,
          restaurantId: orderData.restaurantId,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
          },
        },
      });

      if (existingOrder) {
        console.log(`Order already exists: ${existingOrder.id}`);
        return true; // Consider this a success
      }

      // Retry order creation
      const order = await prisma.order.create({
        data: orderData,
      });

      console.log(`✅ Order created on retry: ${order.id}`);
      return true;

    } catch (error) {
      console.error('Failed to retry order creation:', error);
      return false;
    }
  }

  // Retry payment processing
  private static async retryPaymentProcessing(operation: any): Promise<boolean> {
    try {
      const { orderId, paymentIntentId } = operation.data;
      
      // Check current payment status
      const result = await paymentService.confirmPaymentIntent(paymentIntentId);
      
      if (result.status === 'succeeded') {
        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: PaymentStatus.COMPLETED },
        });
        
        console.log(`✅ Payment confirmed on retry: ${paymentIntentId}`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Failed to retry payment processing:', error);
      return false;
    }
  }

  // Retry inventory update
  private static async retryInventoryUpdate(operation: any): Promise<boolean> {
    try {
      const { menuItemId, quantity, operation: inventoryOp } = operation.data;
      
      // Implement inventory update retry logic
      // This would depend on your inventory management system
      console.log(`Retrying inventory update: ${inventoryOp} ${quantity} for ${menuItemId}`);
      
      // For now, just log success (implement actual logic based on your needs)
      return true;

    } catch (error) {
      console.error('Failed to retry inventory update:', error);
      return false;
    }
  }

  // Retry notification send
  private static async retryNotificationSend(operation: any): Promise<boolean> {
    try {
      const { notificationType, recipient, data } = operation.data;
      
      // Implement notification retry logic
      // This could be email, SMS, push notification, etc.
      console.log(`Retrying notification: ${notificationType} to ${recipient}`);
      
      // For now, just log success (implement actual logic based on your needs)
      return true;

    } catch (error) {
      console.error('Failed to retry notification send:', error);
      return false;
    }
  }

  // Retry audit log
  private static async retryAuditLog(operation: any): Promise<boolean> {
    try {
      const { logEntry } = operation.data;
      
      // Retry logging to audit service
      await auditHelpers.logUserActivity(
        operation.context,
        logEntry.action,
        logEntry.details
      );
      
      console.log(`✅ Audit log written on retry`);
      return true;

    } catch (error) {
      console.error('Failed to retry audit log:', error);
      return false;
    }
  }

  // Handle permanent failure
  private static async handlePermanentFailure(operation: any): Promise<void> {
    try {
      // Store in permanent failure log
      const failureLog = {
        operationId: operation.id,
        type: operation.type,
        data: operation.data,
        error: operation.error,
        context: operation.context,
        attempts: operation.attempts,
        failedAt: new Date().toISOString(),
      };

      // Store in Redis with longer TTL for review
      await redis.setEx(
        `permanent_failure:${operation.id}`,
        7 * 24 * 3600, // 7 days
        JSON.stringify(failureLog)
      );

      // Log critical error
      console.error(`🚨 PERMANENT FAILURE: ${operation.type}`, failureLog);

      // Send alert to administrators (implement based on your needs)
      await this.sendAdminAlert(operation);

      // For critical operations, take additional action
      if (this.isCriticalOperation(operation.type)) {
        await this.handleCriticalFailure(operation);
      }

    } catch (error) {
      console.error('Failed to handle permanent failure:', error);
    }
  }

  // Check if operation is critical
  private static isCriticalOperation(operationType: string): boolean {
    const criticalOperations = [
      this.RETRYABLE_OPERATIONS.ORDER_CREATION,
      this.RETRYABLE_OPERATIONS.PAYMENT_PROCESSING,
    ];
    
    return criticalOperations.includes(operationType);
  }

  // Handle critical operation failure
  private static async handleCriticalFailure(operation: any): Promise<void> {
    try {
      switch (operation.type) {
        case this.RETRYABLE_OPERATIONS.ORDER_CREATION:
          // Mark order as failed, refund payment if necessary
          await this.handleFailedOrderCreation(operation);
          break;
        case this.RETRYABLE_OPERATIONS.PAYMENT_PROCESSING:
          // Handle failed payment processing
          await this.handleFailedPayment(operation);
          break;
        default:
          console.log(`No specific critical failure handler for ${operation.type}`);
      }
    } catch (error) {
      console.error('Failed to handle critical failure:', error);
    }
  }

  // Handle failed order creation
  private static async handleFailedOrderCreation(operation: any): Promise<void> {
    try {
      const { userId, orderData } = operation.data;
      
      // Check if payment was processed
      if (orderData.paymentIntentId) {
        // Initiate refund
        await paymentService.processRefund(
          orderData.paymentIntentId,
          undefined,
          'Order creation failed'
        );
      }

      // Send notification to customer
      console.log(`Notifying customer ${userId} about failed order creation`);

    } catch (error) {
      console.error('Failed to handle failed order creation:', error);
    }
  }

  // Handle failed payment
  private static async handleFailedPayment(operation: any): Promise<void> {
    try {
      const { orderId } = operation.data;
      
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.CANCELLED,
        },
      });

      console.log(`Marked order ${orderId} as failed due to payment issues`);

    } catch (error) {
      console.error('Failed to handle failed payment:', error);
    }
  }

  // Send admin alert
  private static async sendAdminAlert(operation: any): Promise<void> {
    try {
      // Implement admin alerting mechanism
      // This could be email, Slack, SMS, etc.
      console.log(`🚨 ADMIN ALERT: Critical operation failed - ${operation.type}`);
      
      // Store in admin alerts queue
      await redis.lPush('admin_alerts', JSON.stringify({
        type: 'CRITICAL_OPERATION_FAILURE',
        operation: operation.type,
        error: operation.error.message,
        timestamp: new Date().toISOString(),
        operationId: operation.id,
      }));

    } catch (error) {
      console.error('Failed to send admin alert:', error);
    }
  }

  // Log critical error to external service
  private static async logCriticalError(
    operationType: string,
    operationData: any,
    originalError: Error,
    queueError: Error
  ): Promise<void> {
    try {
      // This would typically send to an external logging service
      // like Sentry, DataDog, CloudWatch, etc.
      const criticalError = {
        type: 'CRITICAL_SYSTEM_ERROR',
        operationType,
        originalError: {
          message: originalError.message,
          stack: originalError.stack,
        },
        queueError: {
          message: queueError.message,
          stack: queueError.stack,
        },
        operationData,
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL',
      };

      console.error('🚨 CRITICAL SYSTEM ERROR:', criticalError);
      
      // Store in Redis for emergency review
      await redis.setEx(
        `critical_error:${Date.now()}`,
        24 * 3600, // 24 hours
        JSON.stringify(criticalError)
      );

    } catch (error) {
      // Last resort - write to console
      console.error('FAILED TO LOG CRITICAL ERROR:', error);
      console.error('ORIGINAL ERROR:', originalError);
      console.error('QUEUE ERROR:', queueError);
    }
  }

  // Get retry queue status
  static async getRetryQueueStatus(): Promise<{
    queueLength: number;
    pendingOperations: number;
    failedOperations: number;
    oldestOperation?: string;
  }> {
    try {
      const queueLength = await redis.lLen(this.QUEUE_KEY);
      const failureKeys = await redis.keys('permanent_failure:*');
      
      // Get oldest operation for monitoring
      let oldestOperation;
      if (queueLength > 0) {
        const oldestData = await redis.lIndex(this.QUEUE_KEY, -1);
        if (oldestData) {
          const operation = JSON.parse(oldestData);
          oldestOperation = operation.createdAt;
        }
      }

      return {
        queueLength,
        pendingOperations: queueLength,
        failedOperations: failureKeys.length,
        oldestOperation,
      };

    } catch (error) {
      console.error('Failed to get retry queue status:', error);
      return {
        queueLength: 0,
        pendingOperations: 0,
        failedOperations: 0,
      };
    }
  }

  // Health check for error recovery system
  static async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: any;
  }> {
    const issues: string[] = [];
    let healthy = true;

    try {
      const status = await this.getRetryQueueStatus();
      
      // Check if queue is too large
      if (status.queueLength > 100) {
        issues.push(`Retry queue too large: ${status.queueLength} operations`);
        healthy = false;
      }

      // Check if oldest operation is too old
      if (status.oldestOperation) {
        const ageMs = Date.now() - new Date(status.oldestOperation).getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        
        if (ageHours > 24) {
          issues.push(`Oldest operation is ${ageHours.toFixed(1)} hours old`);
          healthy = false;
        }
      }

      // Check Redis connectivity
      await redis.ping();

      return {
        healthy,
        issues,
        metrics: {
          queueLength: status.queueLength,
          pendingOperations: status.pendingOperations,
          failedOperations: status.failedOperations,
          oldestOperationAge: status.oldestOperation,
        },
      };

    } catch (error) {
      return {
        healthy: false,
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metrics: {},
      };
    }
  }
}

// Set up periodic retry processing (every 30 seconds)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    ErrorRecoveryService.processRetryQueue();
  }, 30 * 1000);
}

export default ErrorRecoveryService;