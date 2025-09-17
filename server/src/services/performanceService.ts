import { PrismaClient } from '@prisma/client';
import { redis } from '../index';

const prisma = new PrismaClient();

// Simple logger utility
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

interface PerformanceMetrics {
  queryTime: number;
  cacheHitRate: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
}

interface CacheConfig {
  key: string;
  ttl: number;
  compress?: boolean;
}

export class PerformanceService {
  private static readonly CACHE_PREFIXES = {
    MENU_ITEM: 'menu:item:',
    RESTAURANT: 'restaurant:',
    USER: 'user:',
    ORDER_CALCULATION: 'calc:order:',
    INVENTORY: 'inventory:',
    COUPON: 'coupon:',
  };

  private static readonly CACHE_TTL = {
    MENU_ITEM: 300, // 5 minutes
    RESTAURANT: 600, // 10 minutes  
    USER: 900, // 15 minutes
    ORDER_CALCULATION: 60, // 1 minute
    INVENTORY: 30, // 30 seconds
    COUPON: 1800, // 30 minutes
  };

  // Optimized menu item queries with caching
  static async getMenuItemsWithCache(restaurantId: string): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIXES.MENU_ITEM}restaurant:${restaurantId}`;
    
    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for menu items', { restaurantId });
        return JSON.parse(cached);
      }

      // Cache miss - query database with optimizations
      const startTime = Date.now();
      
      const menuItems = await prisma.menuItem.findMany({
        where: {
          restaurantId,
          isAvailable: true,
        },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          image: true,
          preparationTime: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const queryTime = Date.now() - startTime;
      logger.info('Database query completed', { restaurantId, queryTime, itemCount: menuItems.length });

      // Cache the result
      await redis.setEx(cacheKey, this.CACHE_TTL.MENU_ITEM, JSON.stringify(menuItems));

      return menuItems;

    } catch (error: any) {
      logger.error('Error fetching menu items', { error: error?.message || error, restaurantId });
      throw error;
    }
  }

  // Optimized restaurant data with caching
  static async getRestaurantWithCache(restaurantId: string): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIXES.RESTAURANT}${restaurantId}`;
    
    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for restaurant', { restaurantId });
        return JSON.parse(cached);
      }

      // Cache miss - optimized query
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          id: true,
          name: true,
          image: true,
          deliveryFee: true,
          minimumOrder: true,
          deliveryTime: true,
          isOpen: true,
          address: true,
          phone: true,
          rating: true,
        },
      });

      if (restaurant) {
        await redis.setEx(cacheKey, this.CACHE_TTL.RESTAURANT, JSON.stringify(restaurant));
      }

      return restaurant;

    } catch (error: any) {
      logger.error('Error fetching restaurant', { error: error?.message || error, restaurantId });
      throw error;
    }
  }

  // Optimized user data with caching
  static async getUserWithCache(userId: string): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIXES.USER}${userId}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });

      if (user) {
        await redis.setEx(cacheKey, this.CACHE_TTL.USER, JSON.stringify(user));
      }

      return user;

    } catch (error: any) {
      logger.error('Error fetching user', { error: error?.message || error, userId });
      throw error;
    }
  }

  // Cache order calculation results
  static async cacheOrderCalculation(
    restaurantId: string,
    items: Array<{ menuItemId: string; quantity: number }>,
    couponCode: string | undefined,
    calculation: any
  ): Promise<void> {
    try {
      const cacheKey = this.getOrderCalculationCacheKey(restaurantId, items, couponCode);
      await redis.setEx(cacheKey, this.CACHE_TTL.ORDER_CALCULATION, JSON.stringify(calculation));
    } catch (error: any) {
      logger.warn('Failed to cache order calculation', { error: error?.message || error });
    }
  }

  // Get cached order calculation
  static async getCachedOrderCalculation(
    restaurantId: string,
    items: Array<{ menuItemId: string; quantity: number }>,
    couponCode?: string
  ): Promise<any | null> {
    try {
      const cacheKey = this.getOrderCalculationCacheKey(restaurantId, items, couponCode);
      const cached = await redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error: any) {
      logger.warn('Failed to get cached order calculation', { error: error?.message || error });
      return null;
    }
  }

  // Generate cache key for order calculations
  private static getOrderCalculationCacheKey(
    restaurantId: string,
    items: Array<{ menuItemId: string; quantity: number }>,
    couponCode?: string
  ): string {
    const itemsHash = items
      .sort((a, b) => a.menuItemId.localeCompare(b.menuItemId))
      .map(item => `${item.menuItemId}:${item.quantity}`)
      .join('|');
    
    const couponPart = couponCode ? `:${couponCode}` : '';
    return `${this.CACHE_PREFIXES.ORDER_CALCULATION}${restaurantId}:${itemsHash}${couponPart}`;
  }

  // Bulk cache invalidation
  static async invalidateCache(patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          // Delete keys one by one to avoid Redis client issues
          for (const key of keys) {
            await redis.del(key);
          }
          logger.info('Cache invalidated', { pattern, keyCount: keys.length });
        }
      }
    } catch (error: any) {
      logger.error('Failed to invalidate cache', { error: error?.message || error, patterns });
    }
  }

  // Invalidate specific entity caches
  static async invalidateRestaurantCache(restaurantId: string): Promise<void> {
    const patterns = [
      `${this.CACHE_PREFIXES.RESTAURANT}${restaurantId}`,
      `${this.CACHE_PREFIXES.MENU_ITEM}restaurant:${restaurantId}`,
      `${this.CACHE_PREFIXES.ORDER_CALCULATION}${restaurantId}:*`,
    ];
    await this.invalidateCache(patterns);
  }

  static async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [`${this.CACHE_PREFIXES.USER}${userId}`];
    await this.invalidateCache(patterns);
  }

  static async invalidateMenuItemCache(menuItemId: string, restaurantId: string): Promise<void> {
    const patterns = [
      `${this.CACHE_PREFIXES.MENU_ITEM}restaurant:${restaurantId}`,
      `${this.CACHE_PREFIXES.ORDER_CALCULATION}${restaurantId}:*`,
    ];
    await this.invalidateCache(patterns);
  }

  // Database connection pooling optimization
  static async optimizeDatabaseConnections(): Promise<void> {
    try {
      // Configure Prisma connection pool
      await prisma.$connect();
      
      // Monitor connection pool health
      const metrics = await this.getDatabaseMetrics();
      logger.info('Database connection pool optimized', metrics);

    } catch (error: any) {
      logger.error('Failed to optimize database connections', { error: error?.message || error });
    }
  }

  // Get database performance metrics
  static async getDatabaseMetrics(): Promise<any> {
    try {
      const queries = [
        // Count active orders
        prisma.order.count({
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'PREPARING'],
            },
          },
        }),
        
        // Count total restaurants
        prisma.restaurant.count(),
        
        // Count total users
        prisma.user.count(),
      ];

      const startTime = Date.now();
      const [activeOrders, totalRestaurants, totalUsers] = await Promise.all(queries);
      const queryTime = Date.now() - startTime;

      return {
        activeOrders,
        totalRestaurants,
        totalUsers,
        queryTime,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      logger.error('Failed to get database metrics', { error: error?.message || error });
      return null;
    }
  }

  // Performance monitoring and alerting
  static async monitorPerformance(): Promise<PerformanceMetrics> {
    try {
      const dbMetrics = await this.getDatabaseMetrics();

      // Calculate cache hit rate (simplified)
      const cacheHitRate = await this.calculateCacheHitRate();

      const metrics: PerformanceMetrics = {
        queryTime: dbMetrics?.queryTime || 0,
        cacheHitRate,
        totalRequests: 0, // Placeholder
        averageResponseTime: 0, // Placeholder
        errorRate: 0, // Placeholder
      };

      // Log performance metrics
      logger.info('Performance metrics collected', metrics);

      // Check for performance issues
      await this.checkPerformanceThresholds(metrics);

      return metrics;

    } catch (error: any) {
      logger.error('Failed to monitor performance', { error: error?.message || error });
      throw error;
    }
  }

  // Calculate cache hit rate
  private static async calculateCacheHitRate(): Promise<number> {
    try {
      // Get cache hit/miss statistics from Redis
      const info = await redis.info('stats');
      const stats = this.parseRedisInfo(info);
      
      const hits = parseInt(stats.keyspace_hits || '0');
      const misses = parseInt(stats.keyspace_misses || '0');
      const total = hits + misses;
      
      return total > 0 ? (hits / total) * 100 : 0;

    } catch (error: any) {
      logger.warn('Failed to calculate cache hit rate', { error: error?.message || error });
      return 0;
    }
  }

  // Parse Redis info output
  private static parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const metrics: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        metrics[key] = value;
      }
    }
    
    return metrics;
  }

  // Check performance thresholds and alert if needed
  private static async checkPerformanceThresholds(metrics: PerformanceMetrics): Promise<void> {
    const thresholds = {
      maxQueryTime: 1000, // 1 second
      minCacheHitRate: 80, // 80%
      maxErrorRate: 5, // 5%
      maxResponseTime: 2000, // 2 seconds
    };

    const alerts: string[] = [];

    if (metrics.queryTime > thresholds.maxQueryTime) {
      alerts.push(`High database query time: ${metrics.queryTime}ms`);
    }

    if (metrics.cacheHitRate < thresholds.minCacheHitRate) {
      alerts.push(`Low cache hit rate: ${metrics.cacheHitRate}%`);
    }

    if (metrics.errorRate > thresholds.maxErrorRate) {
      alerts.push(`High error rate: ${metrics.errorRate}%`);
    }

    if (metrics.averageResponseTime > thresholds.maxResponseTime) {
      alerts.push(`High response time: ${metrics.averageResponseTime}ms`);
    }

    if (alerts.length > 0) {
      logger.warn('Performance alerts triggered', { alerts, metrics });
    }
  }

  // Warm up caches for better performance
  static async warmUpCaches(): Promise<void> {
    try {
      logger.info('Starting cache warm-up process');

      // Get most popular restaurants
      const popularRestaurants = await prisma.restaurant.findMany({
        where: { isOpen: true },
        take: 10,
        orderBy: { rating: 'desc' },
        select: { id: true },
      });

      // Warm up restaurant and menu item caches
      const warmUpPromises = popularRestaurants.map(async (restaurant) => {
        await this.getRestaurantWithCache(restaurant.id);
        await this.getMenuItemsWithCache(restaurant.id);
      });

      await Promise.all(warmUpPromises);

      logger.info('Cache warm-up completed', { restaurantCount: popularRestaurants.length });

    } catch (error: any) {
      logger.error('Cache warm-up failed', { error: error?.message || error });
    }
  }

  // Database query optimization utilities
  static async optimizeQuery<T>(
    queryFn: () => Promise<T>,
    cacheConfig?: CacheConfig
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Try cache first if config provided
      if (cacheConfig) {
        const cached = await redis.get(cacheConfig.key);
        if (cached) {
          const result = JSON.parse(cached);
          logger.debug('Query served from cache', { 
            key: cacheConfig.key, 
            time: Date.now() - startTime 
          });
          return result;
        }
      }

      // Execute query
      const result = await queryFn();
      const queryTime = Date.now() - startTime;

      // Cache result if config provided
      if (cacheConfig) {
        await redis.setEx(cacheConfig.key, cacheConfig.ttl, JSON.stringify(result));
      }

      logger.debug('Query executed', { 
        cached: !!cacheConfig,
        time: queryTime 
      });

      return result;

    } catch (error: any) {
      logger.error('Query optimization failed', { 
        error: error?.message || error,
        time: Date.now() - startTime 
      });
      throw error;
    }
  }

  // Cleanup old cache entries
  static async cleanupCache(): Promise<void> {
    try {
      logger.info('Starting cache cleanup');

      // Get all keys with TTL information
      const patterns = Object.values(this.CACHE_PREFIXES);
      let totalDeleted = 0;

      for (const pattern of patterns) {
        const keys = await redis.keys(`${pattern}*`);
        
        for (const key of keys) {
          const ttl = await redis.ttl(key);
          
          // Delete keys that have no TTL set (never expire) or are close to expiring
          if (ttl === -1 || ttl < 60) {
            await redis.del(key);
            totalDeleted++;
          }
        }
      }

      logger.info('Cache cleanup completed', { deletedKeys: totalDeleted });

    } catch (error: any) {
      logger.error('Cache cleanup failed', { error: error?.message || error });
    }
  }
}