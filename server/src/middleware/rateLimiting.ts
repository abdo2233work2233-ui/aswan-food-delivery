import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { redis } from '../index';
import { ApiResponse } from '../types';

// Custom rate limiter with Redis store
export class RedisRateLimiter {
  private redis: any;
  private keyPrefix: string;

  constructor(redisClient: any, keyPrefix: string = 'rate_limit:') {
    this.redis = redisClient;
    this.keyPrefix = keyPrefix;
  }

  async increment(key: string, windowMs: number): Promise<{ totalRequests: number; resetTime: number }> {
    const fullKey = `${this.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Use Redis pipeline for efficiency
    const pipeline = this.redis.multi();
    
    // Remove expired entries
    pipeline.zremrangebyscore(fullKey, 0, windowStart);
    
    // Add current request
    pipeline.zadd(fullKey, now, `${now}-${Math.random()}`);
    
    // Count current requests in window
    pipeline.zcard(fullKey);
    
    // Set expiration
    pipeline.expire(fullKey, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const totalRequests = results[2][1];
    const resetTime = now + windowMs;

    return { totalRequests, resetTime };
  }

  async reset(key: string): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    await this.redis.del(fullKey);
  }
}

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    messageAr: 'عدد كبير جداً من الطلبات من هذا العنوان، يرجى المحاولة لاحقاً.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
});

// Strict rate limiting for checkout endpoints
export const checkoutRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Only 5 checkout attempts per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many checkout attempts. Please wait before trying again.',
    messageAr: 'محاولات كثيرة لإتمام الطلب. يرجى الانتظار قبل المحاولة مرة أخرى.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  skip: (req: Request) => {
    // Skip rate limiting for admin users (implement your admin check here)
    return false;
  },
});

// Payment processing rate limiting
export const paymentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Only 3 payment attempts per 5 minutes per IP
  message: {
    success: false,
    message: 'Too many payment attempts. Please wait before trying again.',
    messageAr: 'محاولات كثيرة للدفع. يرجى الانتظار قبل المحاولة مرة أخرى.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// User-specific rate limiting (requires authentication)
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  const rateLimiter = new RedisRateLimiter(redis);

  return async (req: any, res: Response, next: any) => {
    if (!req.user?.id) {
      return next(); // Skip if no authenticated user
    }

    try {
      const key = `user:${req.user.id}`;
      const { totalRequests, resetTime } = await rateLimiter.increment(key, windowMs);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - totalRequests).toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      });

      if (totalRequests > maxRequests) {
        const response: ApiResponse = {
          success: false,
          message: 'Rate limit exceeded for this user.',
          messageAr: 'تم تجاوز حد الطلبات لهذا المستخدم.',
        };
        return res.status(429).json(response);
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting if Redis fails
      next();
    }
  };
};

// Order creation rate limiting per user
export const orderCreationRateLimit = createUserRateLimit(10, 60 * 60 * 1000); // 10 orders per hour per user

// Coupon validation rate limiting per user
export const couponValidationRateLimit = createUserRateLimit(20, 60 * 1000); // 20 coupon checks per minute per user

// Fraud detection middleware
export const fraudDetectionMiddleware = async (req: any, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    const ip = req.ip;
    
    if (!userId) {
      return next();
    }

    // Check for suspicious patterns
    const suspiciousPatterns = await detectSuspiciousActivity(userId, ip, req.body);
    
    if (suspiciousPatterns.length > 0) {
      console.warn(`🚨 Suspicious activity detected for user ${userId}:`, suspiciousPatterns);
      
      // Log the suspicious activity
      await logSuspiciousActivity(userId, ip, suspiciousPatterns, req.body);
      
      // For high-risk patterns, block the request
      if (suspiciousPatterns.some(pattern => pattern.risk === 'HIGH')) {
        const response: ApiResponse = {
          success: false,
          message: 'Request blocked due to suspicious activity.',
          messageAr: 'تم حظر الطلب بسبب نشاط مشبوه.',
        };
        return res.status(403).json(response);
      }
    }

    next();
  } catch (error) {
    console.error('Fraud detection error:', error);
    // Continue without fraud detection if it fails
    next();
  }
};

// Detect suspicious activity patterns
async function detectSuspiciousActivity(userId: string, ip: string, requestBody: any): Promise<Array<{ pattern: string; risk: 'LOW' | 'MEDIUM' | 'HIGH' }>> {
  const patterns: Array<{ pattern: string; risk: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];

  try {
    // Check for rapid repeated requests
    const recentOrdersKey = `recent_orders:${userId}`;
    const recentOrders = await redis.lLen(recentOrdersKey);
    
    if (recentOrders > 5) {
      patterns.push({ pattern: 'Rapid order creation', risk: 'MEDIUM' });
    }

    // Check for unusual order amounts
    if (requestBody.total && (requestBody.total > 5000 || requestBody.total < 0)) {
      patterns.push({ pattern: 'Unusual order amount', risk: 'HIGH' });
    }

    // Check for excessive coupon usage
    if (requestBody.couponCode) {
      const couponUsageKey = `coupon_usage:${userId}`;
      const couponUsage = await redis.incr(couponUsageKey);
      await redis.expire(couponUsageKey, 3600); // 1 hour window
      
      if (couponUsage > 10) {
        patterns.push({ pattern: 'Excessive coupon usage', risk: 'MEDIUM' });
      }
    }

    // Check for multiple payment methods in short time
    if (requestBody.paymentMethod === 'CARD') {
      const paymentAttemptsKey = `payment_attempts:${userId}`;
      const paymentAttempts = await redis.incr(paymentAttemptsKey);
      await redis.expire(paymentAttemptsKey, 600); // 10 minutes window
      
      if (paymentAttempts > 3) {
        patterns.push({ pattern: 'Multiple payment attempts', risk: 'MEDIUM' });
      }
    }

    // Check for IP changes
    const userIpKey = `user_ip:${userId}`;
    const lastIp = await redis.get(userIpKey);
    
    if (lastIp && lastIp !== ip) {
      patterns.push({ pattern: 'IP address change', risk: 'LOW' });
    }
    
    await redis.setEx(userIpKey, 3600, ip); // Store current IP for 1 hour

  } catch (error) {
    console.error('Error in suspicious activity detection:', error);
  }

  return patterns;
}

// Log suspicious activity for review
async function logSuspiciousActivity(userId: string, ip: string, patterns: any[], requestBody: any): Promise<void> {
  const logEntry = {
    userId,
    ip,
    patterns,
    requestBody: JSON.stringify(requestBody),
    timestamp: new Date().toISOString(),
  };

  // Store in Redis for later review
  const logKey = `suspicious_activity:${Date.now()}`;
  await redis.setEx(logKey, 7 * 24 * 3600, JSON.stringify(logEntry)); // Keep for 7 days

  // You might also want to send alerts to administrators
  console.log('🚨 Suspicious activity logged:', logEntry);
}

// Cleanup expired rate limit data (run periodically)
export const cleanupRateLimitData = async () => {
  try {
    const keys = await redis.keys('rate_limit:*');
    const pipeline = redis.multi();

    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        pipeline.del(key);
      }
    }

    await pipeline.exec();
    console.log(`🧹 Cleaned up ${keys.length} rate limit keys`);
  } catch (error) {
    console.error('Error cleaning up rate limit data:', error);
  }
};

// Export default rate limiters
export default {
  general: generalRateLimit,
  checkout: checkoutRateLimit,
  payment: paymentRateLimit,
  orderCreation: orderCreationRateLimit,
  couponValidation: couponValidationRateLimit,
  fraudDetection: fraudDetectionMiddleware,
};