import { prisma } from '../index';
import { redis } from '../index';
import { io } from '../index';

// Real-time inventory management service
export class InventoryService {
  
  // Cache key patterns
  private static readonly STOCK_KEY = 'stock:';
  private static readonly RESERVED_KEY = 'reserved:';
  private static readonly LOCK_KEY = 'lock:';
  
  // Cache TTL (1 hour)
  private static readonly CACHE_TTL = 3600;
  
  // Reservation TTL (15 minutes)
  private static readonly RESERVATION_TTL = 900;

  // Get current stock level with caching
  static async getStockLevel(menuItemId: string): Promise<number> {
    try {
      // Try cache first
      const cacheKey = `${this.STOCK_KEY}${menuItemId}`;
      const cachedStock = await redis.get(cacheKey);
      
      if (cachedStock !== null) {
        return parseInt(cachedStock, 10);
      }

      // Fetch from database
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        select: { 
          // stock: true, // Add this field to schema if needed
          isAvailable: true 
        },
      });

      if (!menuItem) {
        throw new Error(`Menu item ${menuItemId} not found`);
      }

      // For now, return unlimited stock since stock field doesn't exist
      // const stock = menuItem.stock ?? -1; // -1 = unlimited
      const stock = menuItem.isAvailable ? 999 : 0; // Temporary implementation
      
      // Cache the result
      await redis.setEx(cacheKey, this.CACHE_TTL, stock.toString());
      
      return stock;
    } catch (error) {
      console.error('Error getting stock level:', error);
      return 0; // Fail safe - no stock available
    }
  }

  // Get reserved quantity for an item
  static async getReservedQuantity(menuItemId: string): Promise<number> {
    try {
      const reservedKey = `${this.RESERVED_KEY}${menuItemId}`;
      const reserved = await redis.get(reservedKey);
      return reserved ? parseInt(reserved, 10) : 0;
    } catch (error) {
      console.error('Error getting reserved quantity:', error);
      return 0;
    }
  }

  // Get available stock (total stock - reserved)
  static async getAvailableStock(menuItemId: string): Promise<number> {
    try {
      const [totalStock, reserved] = await Promise.all([
        this.getStockLevel(menuItemId),
        this.getReservedQuantity(menuItemId),
      ]);

      // If unlimited stock (-1), return a large number
      if (totalStock === -1) {
        return 999999;
      }

      return Math.max(0, totalStock - reserved);
    } catch (error) {
      console.error('Error getting available stock:', error);
      return 0;
    }
  }

  // Reserve items for a pending order
  static async reserveItems(
    items: Array<{ menuItemId: string; quantity: number }>,
    reservationId: string,
    userId: string
  ): Promise<{ success: boolean; errors: string[]; reservationDetails: any }> {
    const errors: string[] = [];
    const reservationDetails: any = {};
    
    try {
      // Check availability for all items first
      for (const item of items) {
        const available = await this.getAvailableStock(item.menuItemId);
        
        if (available < item.quantity) {
          errors.push(`Insufficient stock for item ${item.menuItemId}: requested ${item.quantity}, available ${available}`);
        }
      }

      if (errors.length > 0) {
        return { success: false, errors, reservationDetails };
      }

      // Reserve items using Redis transactions
      const pipeline = redis.multi();
      
      for (const item of items) {
        const reservedKey = `${this.RESERVED_KEY}${item.menuItemId}`;
        const lockKey = `${this.LOCK_KEY}${item.menuItemId}`;
        
        // Increment reserved quantity
        pipeline.incrBy(reservedKey, item.quantity);
        pipeline.expire(reservedKey, this.RESERVATION_TTL);
        
        // Store reservation details
        const reservationKey = `reservation:${reservationId}:${item.menuItemId}`;
        const reservationData = {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          userId,
          timestamp: Date.now(),
          expiresAt: Date.now() + (this.RESERVATION_TTL * 1000),
        };
        
        pipeline.setEx(reservationKey, this.RESERVATION_TTL, JSON.stringify(reservationData));
        
        reservationDetails[item.menuItemId] = reservationData;
      }

      await pipeline.exec();

      // Emit real-time stock updates
      await this.emitStockUpdates(items.map(item => item.menuItemId));

      console.log(`📦 Reserved items for user ${userId}, reservation ${reservationId}`);
      
      return { success: true, errors: [], reservationDetails };

    } catch (error) {
      console.error('Error reserving items:', error);
      errors.push('Failed to reserve items');
      return { success: false, errors, reservationDetails };
    }
  }

  // Confirm reservation and update actual stock
  static async confirmReservation(
    reservationId: string,
    orderId: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Get all reservation keys for this reservation
      const reservationKeys = await redis.keys(`reservation:${reservationId}:*`);
      
      if (reservationKeys.length === 0) {
        errors.push('Reservation not found or expired');
        return { success: false, errors };
      }

      const pipeline = redis.multi();
      const stockUpdates: Array<{ menuItemId: string; quantity: number }> = [];

      for (const reservationKey of reservationKeys) {
        const reservationData = await redis.get(reservationKey);
        
        if (reservationData) {
          const reservation = JSON.parse(reservationData);
          const { menuItemId, quantity } = reservation;

          // Update actual stock in database (if stock field exists)
          // await prisma.menuItem.update({
          //   where: { id: menuItemId },
          //   data: { stock: { decrement: quantity } },
          // });

          // Clear cache to force refresh
          const stockKey = `${this.STOCK_KEY}${menuItemId}`;
          pipeline.del(stockKey);

          // Reduce reserved quantity
          const reservedKey = `${this.RESERVED_KEY}${menuItemId}`;
          pipeline.decrBy(reservedKey, quantity);

          // Remove reservation
          pipeline.del(reservationKey);

          stockUpdates.push({ menuItemId, quantity });
        }
      }

      await pipeline.exec();

      // Log the stock update
      console.log(`📦 Confirmed reservation ${reservationId} for order ${orderId}`);

      // Emit real-time stock updates
      await this.emitStockUpdates(stockUpdates.map(update => update.menuItemId));

      return { success: true, errors: [] };

    } catch (error) {
      console.error('Error confirming reservation:', error);
      errors.push('Failed to confirm reservation');
      return { success: false, errors };
    }
  }

  // Cancel reservation and release items
  static async cancelReservation(reservationId: string): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const reservationKeys = await redis.keys(`reservation:${reservationId}:*`);
      
      if (reservationKeys.length === 0) {
        // Reservation might have already expired
        return { success: true, errors: [] };
      }

      const pipeline = redis.multi();
      const releasedItems: string[] = [];

      for (const reservationKey of reservationKeys) {
        const reservationData = await redis.get(reservationKey);
        
        if (reservationData) {
          const reservation = JSON.parse(reservationData);
          const { menuItemId, quantity } = reservation;

          // Reduce reserved quantity
          const reservedKey = `${this.RESERVED_KEY}${menuItemId}`;
          pipeline.decrBy(reservedKey, quantity);

          // Remove reservation
          pipeline.del(reservationKey);

          releasedItems.push(menuItemId);
        }
      }

      await pipeline.exec();

      console.log(`📦 Cancelled reservation ${reservationId}`);

      // Emit real-time stock updates
      await this.emitStockUpdates(releasedItems);

      return { success: true, errors: [] };

    } catch (error) {
      console.error('Error cancelling reservation:', error);
      errors.push('Failed to cancel reservation');
      return { success: false, errors };
    }
  }

  // Update stock level (for restaurant owners)
  static async updateStockLevel(
    menuItemId: string,
    newStock: number,
    userId: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Validate stock level
      if (newStock < -1 || newStock > 10000) {
        errors.push('Invalid stock level');
        return { success: false, errors };
      }

      // Update database (if stock field exists)
      // await prisma.menuItem.update({
      //   where: { id: menuItemId },
      //   data: { stock: newStock },
      // });

      // Update cache
      const stockKey = `${this.STOCK_KEY}${menuItemId}`;
      if (newStock === -1) {
        // Unlimited stock
        await redis.setEx(stockKey, this.CACHE_TTL, '-1');
      } else {
        await redis.setEx(stockKey, this.CACHE_TTL, newStock.toString());
      }

      console.log(`📦 Updated stock for ${menuItemId}: ${newStock} by user ${userId}`);

      // Emit real-time stock updates
      await this.emitStockUpdates([menuItemId]);

      return { success: true, errors: [] };

    } catch (error) {
      console.error('Error updating stock level:', error);
      errors.push('Failed to update stock level');
      return { success: false, errors };
    }
  }

  // Check multiple items availability
  static async checkItemsAvailability(
    items: Array<{ menuItemId: string; quantity: number }>
  ): Promise<{ 
    allAvailable: boolean; 
    availabilityDetails: Array<{ menuItemId: string; requested: number; available: number; sufficient: boolean }> 
  }> {
    const availabilityDetails = [];
    let allAvailable = true;

    try {
      for (const item of items) {
        const available = await this.getAvailableStock(item.menuItemId);
        const sufficient = available >= item.quantity;
        
        if (!sufficient) {
          allAvailable = false;
        }

        availabilityDetails.push({
          menuItemId: item.menuItemId,
          requested: item.quantity,
          available,
          sufficient,
        });
      }

      return { allAvailable, availabilityDetails };

    } catch (error) {
      console.error('Error checking items availability:', error);
      return { allAvailable: false, availabilityDetails: [] };
    }
  }

  // Emit real-time stock updates via Socket.IO
  private static async emitStockUpdates(menuItemIds: string[]): Promise<void> {
    try {
      for (const menuItemId of menuItemIds) {
        const [available, reserved] = await Promise.all([
          this.getAvailableStock(menuItemId),
          this.getReservedQuantity(menuItemId),
        ]);

        const stockUpdate = {
          menuItemId,
          availableStock: available,
          reservedStock: reserved,
          timestamp: new Date().toISOString(),
        };

        // Emit to all clients interested in this menu item
        io.emit('stock_update', stockUpdate);
        
        // Emit to specific restaurant room if needed
        // io.to(`restaurant:${restaurantId}`).emit('stock_update', stockUpdate);
      }
    } catch (error) {
      console.error('Error emitting stock updates:', error);
    }
  }

  // Cleanup expired reservations (run periodically)
  static async cleanupExpiredReservations(): Promise<void> {
    try {
      const reservationKeys = await redis.keys('reservation:*');
      const pipeline = redis.multi();
      let cleanedCount = 0;

      for (const key of reservationKeys) {
        const reservationData = await redis.get(key);
        
        if (reservationData) {
          const reservation = JSON.parse(reservationData);
          
          if (Date.now() > reservation.expiresAt) {
            // Release reserved quantity
            const reservedKey = `${this.RESERVED_KEY}${reservation.menuItemId}`;
            pipeline.decrBy(reservedKey, reservation.quantity);
            
            // Remove reservation
            pipeline.del(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        await pipeline.exec();
        console.log(`🧹 Cleaned up ${cleanedCount} expired reservations`);
      }

    } catch (error) {
      console.error('Error cleaning up expired reservations:', error);
    }
  }

  // Get inventory summary for a restaurant
  static async getInventorySummary(restaurantId: string): Promise<{
    totalItems: number;
    availableItems: number;
    outOfStockItems: number;
    lowStockItems: number;
    reservedQuantity: number;
  }> {
    try {
      const menuItems = await prisma.menuItem.findMany({
        where: { restaurantId },
        select: { id: true },
      });

      let availableItems = 0;
      let outOfStockItems = 0;
      let lowStockItems = 0;
      let totalReserved = 0;

      for (const item of menuItems) {
        const [available, reserved] = await Promise.all([
          this.getAvailableStock(item.id),
          this.getReservedQuantity(item.id),
        ]);

        totalReserved += reserved;

        if (available === 0) {
          outOfStockItems++;
        } else if (available > 0 && available <= 5) {
          lowStockItems++;
        } else {
          availableItems++;
        }
      }

      return {
        totalItems: menuItems.length,
        availableItems,
        outOfStockItems,
        lowStockItems,
        reservedQuantity: totalReserved,
      };

    } catch (error) {
      console.error('Error getting inventory summary:', error);
      return {
        totalItems: 0,
        availableItems: 0,
        outOfStockItems: 0,
        lowStockItems: 0,
        reservedQuantity: 0,
      };
    }
  }
}

// Set up periodic cleanup (run every 5 minutes)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    InventoryService.cleanupExpiredReservations();
  }, 5 * 60 * 1000);
}

export default InventoryService;