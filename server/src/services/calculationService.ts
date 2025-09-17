import { prisma } from '../index';
import { OrderCalculation } from '../types';

// Secure calculation service to prevent manipulation
export class SecureCalculationService {
  
  // Calculate order total with multiple validation layers
  static async calculateOrderTotal(
    restaurantId: string,
    items: Array<{ menuItemId: string; quantity: number }>,
    couponCode?: string
  ): Promise<OrderCalculation & { 
    breakdown: any; 
    validation: { isValid: boolean; errors: string[] } 
  }> {
    const validation = { isValid: true, errors: [] as string[] };
    
    try {
      // 1. Validate restaurant exists and is active
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId, isActive: true },
        select: {
          id: true,
          deliveryFee: true,
          minimumOrder: true,
          isOpen: true,
          // taxRate: true, // Add this field to schema if needed
        },
      });

      if (!restaurant) {
        validation.errors.push('Restaurant not found or inactive');
        validation.isValid = false;
        throw new Error('Invalid restaurant');
      }

      if (!restaurant.isOpen) {
        validation.errors.push('Restaurant is currently closed');
        validation.isValid = false;
        throw new Error('Restaurant closed');
      }

      // 2. Validate and fetch menu items with current prices
      const menuItemIds = items.map(item => item.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
          restaurantId,
          isAvailable: true,
        },
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          categoryId: true,
          // Add these fields if they exist in schema
          // maxQuantityPerOrder: true,
          // stock: true,
        },
      });

      if (menuItems.length !== menuItemIds.length) {
        const foundIds = menuItems.map(item => item.id);
        const missingIds = menuItemIds.filter(id => !foundIds.includes(id));
        validation.errors.push(`Menu items not available: ${missingIds.join(', ')}`);
        validation.isValid = false;
        throw new Error('Invalid menu items');
      }

      // 3. Calculate subtotal using ONLY server-side prices
      let subtotal = 0;
      const itemBreakdown = items.map(orderItem => {
        const menuItem = menuItems.find(mi => mi.id === orderItem.menuItemId);
        if (!menuItem) {
          throw new Error(`Menu item ${orderItem.menuItemId} not found`);
        }

        // Validate quantity limits
        if (orderItem.quantity <= 0 || orderItem.quantity > 50) {
          validation.errors.push(`Invalid quantity for ${menuItem.name}: ${orderItem.quantity}`);
          validation.isValid = false;
          throw new Error('Invalid quantity');
        }

        // Use server-side price (never trust client)
        const unitPrice = menuItem.discountPrice || menuItem.price;
        const lineTotal = unitPrice * orderItem.quantity;
        
        // Prevent extreme calculations
        if (lineTotal > 100000) {
          validation.errors.push(`Line total too high: ${lineTotal} EGP`);
          validation.isValid = false;
          throw new Error('Invalid line total');
        }

        subtotal += lineTotal;

        return {
          menuItemId: orderItem.menuItemId,
          name: menuItem.name,
          unitPrice,
          quantity: orderItem.quantity,
          lineTotal,
        };
      });

      // 4. Validate subtotal is reasonable
      if (subtotal < 0 || subtotal > 500000) {
        validation.errors.push(`Invalid subtotal calculated: ${subtotal} EGP`);
        validation.isValid = false;
        throw new Error('Invalid subtotal');
      }

      // 5. Check minimum order requirement
      if (subtotal < restaurant.minimumOrder) {
        validation.errors.push(`Order below minimum: ${subtotal} < ${restaurant.minimumOrder} EGP`);
        validation.isValid = false;
      }

      // 6. Apply coupon with validation
      let discount = 0;
      let couponDetails = null;

      if (couponCode && couponCode.trim()) {
        const couponResult = await this.validateAndApplyCoupon(
          couponCode.trim().toUpperCase(),
          subtotal
        );
        
        if (couponResult.isValid) {
          discount = couponResult.discount;
          couponDetails = couponResult.coupon;
        } else {
          validation.errors.push(...couponResult.errors);
          // Don't fail the entire calculation for invalid coupon
        }
      }

      // 7. Calculate tax (use default 14% since taxRate field doesn't exist yet)
      const taxRate = 0.14; // restaurant.taxRate || 0.14;
      const taxableAmount = Math.max(0, subtotal - discount);
      const tax = Math.round(taxableAmount * taxRate * 100) / 100;

      // 8. Calculate final total
      const deliveryFee = restaurant.deliveryFee;
      const total = Math.round((subtotal + deliveryFee + tax - discount) * 100) / 100;

      // 9. Final validation
      if (total < 0) {
        validation.errors.push('Calculated total is negative');
        validation.isValid = false;
        throw new Error('Invalid total');
      }

      if (total > 1000000) {
        validation.errors.push('Calculated total exceeds maximum limit');
        validation.isValid = false;
        throw new Error('Total too high');
      }

      return {
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee,
        tax,
        discount,
        total,
        breakdown: {
          items: itemBreakdown,
          subtotal,
          deliveryFee,
          tax,
          discount,
          total,
          coupon: couponDetails,
          calculations: {
            taxRate,
            taxableAmount,
            itemCount: items.length,
            totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
          }
        },
        validation,
      };

    } catch (error) {
      validation.isValid = false;
      if (!validation.errors.length) {
        validation.errors.push('Calculation failed');
      }
      
      throw {
        message: error instanceof Error ? error.message : 'Calculation error',
        validation,
      };
    }
  }

  // Validate and apply coupon
  private static async validateAndApplyCoupon(
    couponCode: string,
    subtotal: number
  ): Promise<{
    isValid: boolean;
    errors: string[];
    discount: number;
    coupon: any | null;
  }> {
    const result = {
      isValid: false,
      errors: [] as string[],
      discount: 0,
      coupon: null as any,
    };

    try {
      // Validate coupon format
      if (!/^[A-Z0-9_-]{3,20}$/.test(couponCode)) {
        result.errors.push('Invalid coupon code format');
        return result;
      }

      const coupon = await prisma.coupon.findUnique({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (!coupon) {
        result.errors.push('Coupon not found or expired');
        return result;
      }

      // Check minimum order requirement
      if (subtotal < coupon.minimumOrder) {
        result.errors.push(`Minimum order for coupon: ${coupon.minimumOrder} EGP`);
        return result;
      }

      // Check usage limits
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        result.errors.push('Coupon usage limit reached');
        return result;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }

      // Ensure discount doesn't exceed subtotal
      discount = Math.min(discount, subtotal);
      discount = Math.round(discount * 100) / 100;

      result.isValid = true;
      result.discount = discount;
      result.coupon = {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        appliedDiscount: discount,
      };

      return result;

    } catch (error) {
      result.errors.push('Failed to validate coupon');
      return result;
    }
  }

  // Recalculate with price change detection
  static async recalculateWithPriceCheck(
    orderId: string,
    originalCalculation: OrderCalculation
  ): Promise<{ hasChanges: boolean; newCalculation?: OrderCalculation; changes?: string[] }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            select: {
              menuItemId: true,
              quantity: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const newCalculation = await this.calculateOrderTotal(
        order.restaurantId,
        order.items
      );

      const changes: string[] = [];
      let hasChanges = false;

      // Check for price changes
      if (Math.abs(newCalculation.subtotal - originalCalculation.subtotal) > 0.01) {
        changes.push(`Subtotal changed: ${originalCalculation.subtotal} → ${newCalculation.subtotal}`);
        hasChanges = true;
      }

      if (Math.abs(newCalculation.total - originalCalculation.total) > 0.01) {
        changes.push(`Total changed: ${originalCalculation.total} → ${newCalculation.total}`);
        hasChanges = true;
      }

      return {
        hasChanges,
        newCalculation: hasChanges ? newCalculation : undefined,
        changes: hasChanges ? changes : undefined,
      };

    } catch (error) {
      throw new Error('Failed to recalculate order');
    }
  }
}

export default SecureCalculationService;