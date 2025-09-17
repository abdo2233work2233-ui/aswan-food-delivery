import express from 'express';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../index';
import { validate, createOrderSchema } from '../utils/validation';
import { ApiResponse, AuthenticatedRequest, CreateOrderRequest, OrderCalculation } from '../types';
import { generateOrderNumber, calculateDistance } from '../utils/orderUtils';
import { io } from '../index';
import rateLimiting from '../middleware/rateLimiting';
import { auditHelpers } from '../services/auditService';
import SecureCalculationService from '../services/calculationService';

const router = express.Router();

// Calculate order total
router.post('/calculate', rateLimiting.couponValidation, async (req: AuthenticatedRequest, res, next) => {
  try {
    await auditHelpers.logOrderOperation(req, 'CALCULATE_ORDER_TOTAL', undefined, true, {
      restaurantId: req.body.restaurantId,
      itemCount: req.body.items?.length || 0,
      couponCode: req.body.couponCode ? '***REDACTED***' : undefined,
    });

    const { restaurantId, items, couponCode } = req.body;

    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Restaurant ID and items are required',
        messageAr: 'معرف المطعم والعناصر مطلوبة',
      };
      return res.status(400).json(response);
    }

    // Use secure calculation service
    const calculationResult = await SecureCalculationService.calculateOrderTotal(
      restaurantId,
      items,
      couponCode
    );

    if (!calculationResult.validation.isValid) {
      const response: ApiResponse = {
        success: false,
        message: calculationResult.validation.errors.join(', '),
        messageAr: 'فشل في حساب إجمالي الطلب',
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Order calculation completed successfully',
      messageAr: 'تم حساب الطلب بنجاح',
      data: {
        subtotal: calculationResult.subtotal,
        deliveryFee: calculationResult.deliveryFee,
        tax: calculationResult.tax,
        discount: calculationResult.discount,
        total: calculationResult.total,
        breakdown: calculationResult.breakdown,
      },
    };

    await auditHelpers.logOrderOperation(req, 'ORDER_CALCULATION_SUCCESS', undefined, true, {
      subtotal: calculationResult.subtotal,
      total: calculationResult.total,
      discount: calculationResult.discount,
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Create new order
router.post('/', rateLimiting.checkout, rateLimiting.orderCreation, rateLimiting.fraudDetection, async (req: AuthenticatedRequest, res, next) => {
  try {
    await auditHelpers.logOrderOperation(req, 'CREATE_ORDER_ATTEMPT', undefined, true, {
      restaurantId: req.body.restaurantId,
      itemCount: req.body.items?.length || 0,
      paymentMethod: req.body.paymentMethod,
      addressId: req.body.addressId,
    });
    // Validate input data
    const validatedData = validate(createOrderSchema, req.body) as CreateOrderRequest;

    // Validate order items structure and quantities
    if (!validatedData.items || validatedData.items.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Order must contain at least one item',
        messageAr: 'يجب أن يحتوي الطلب على عنصر واحد على الأقل',
      };
      return res.status(400).json(response);
    }

    // Validate item quantities and prevent abuse
    const totalQuantity = validatedData.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity > 100) {
      const response: ApiResponse = {
        success: false,
        message: 'Total quantity exceeds maximum limit (100 items)',
        messageAr: 'إجمالي الكمية يتجاوز الحد الأقصى (100 عنصر)',
      };
      return res.status(400).json(response);
    }

    // Check for duplicate items and consolidate them
    const consolidatedItems = new Map<string, { quantity: number; notes?: string }>();
    for (const item of validatedData.items) {
      const key = `${item.menuItemId}-${item.notes || ''}`;
      const existing = consolidatedItems.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        consolidatedItems.set(key, { quantity: item.quantity, notes: item.notes });
      }
    }

    // Convert back to array format
    const finalItems = Array.from(consolidatedItems.entries()).map(([key, value]) => {
      const [menuItemId] = key.split('-');
      return {
        menuItemId,
        quantity: value.quantity,
        notes: value.notes,
      };
    });

    // Update validated data with consolidated items
    validatedData.items = finalItems;

    // Get restaurant info with additional security checks
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: validatedData.restaurantId, isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        deliveryFee: true,
        minimumOrder: true,
        isOpen: true,
        ownerId: true,
        latitude: true,
        longitude: true,
        // Note: Add deliveryRadius field to Restaurant model if needed
        // deliveryRadius: true,
      },
    });

    if (!restaurant) {
      const response: ApiResponse = {
        success: false,
        message: 'Restaurant not found or inactive',
        messageAr: 'المطعم غير موجود أو غير نشط',
      };
      return res.status(404).json(response);
    }

    if (!restaurant.isOpen) {
      const response: ApiResponse = {
        success: false,
        message: 'Restaurant is currently closed',
        messageAr: 'المطعم مغلق حالياً',
      };
      return res.status(400).json(response);
    }

    // Verify address belongs to user and is within delivery area
    const address = await prisma.address.findFirst({
      where: {
        id: validatedData.addressId,
        userId: req.user!.id,
      },
    });

    if (!address) {
      const response: ApiResponse = {
        success: false,
        message: 'Address not found or access denied',
        messageAr: 'العنوان غير موجود أو الوصول مرفوض',
      };
      return res.status(404).json(response);
    }

    // Check if address is within delivery area (if delivery radius is implemented)
    // if (restaurant.deliveryRadius && address.latitude && address.longitude) {
    //   const distance = calculateDistance(
    //     restaurant.latitude,
    //     restaurant.longitude,
    //     address.latitude,
    //     address.longitude
    //   );
    //   
    //   if (distance > restaurant.deliveryRadius) {
    //     const response: ApiResponse = {
    //       success: false,
    //       message: `Address is outside delivery area (${restaurant.deliveryRadius}km radius)`,
    //       messageAr: `العنوان خارج منطقة التوصيل (نطاق ${restaurant.deliveryRadius} كم)`,
    //     };
    //     return res.status(400).json(response);
    //   }
    // }

    // Get menu items with comprehensive validation
    const menuItemIds = validatedData.items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: validatedData.restaurantId,
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        price: true,
        discountPrice: true,
        // Note: Add these fields to MenuItem model if needed:
        // stock: true,
        // maxQuantityPerOrder: true,
        // isActive: true,
      },
    });

    // Validate all menu items exist and are available
    if (menuItems.length !== menuItemIds.length) {
      const foundIds = menuItems.map(item => item.id);
      const missingIds = menuItemIds.filter(id => !foundIds.includes(id));
      
      const response: ApiResponse = {
        success: false,
        message: `Menu items not found or unavailable: ${missingIds.join(', ')}`,
        messageAr: 'بعض عناصر القائمة غير متاحة أو غير موجودة',
      };
      return res.status(400).json(response);
    }

    // Validate stock availability and quantity limits
    for (const orderItem of validatedData.items) {
      const menuItem = menuItems.find(item => item.id === orderItem.menuItemId);
      if (!menuItem) continue;

      // Check if item is active (if field exists)
      // if (!menuItem.isActive) {
      //   const response: ApiResponse = {
      //     success: false,
      //     message: `Menu item '${menuItem.name}' is currently inactive`,
      //     messageAr: `عنصر القائمة '${menuItem.nameAr}' غير نشط حالياً`,
      //   };
      //   return res.status(400).json(response);
      // }

      // Check stock availability (if field exists)
      // if (menuItem.stock !== null && menuItem.stock < orderItem.quantity) {
      //   const response: ApiResponse = {
      //     success: false,
      //     message: `Insufficient stock for '${menuItem.name}'. Available: ${menuItem.stock}, Requested: ${orderItem.quantity}`,
      //     messageAr: `مخزون غير كافي لـ '${menuItem.nameAr}'. المتوفر: ${menuItem.stock}، المطلوب: ${orderItem.quantity}`,
      //   };
      //   return res.status(400).json(response);
      // }

      // Check quantity limits per order (if field exists)
      // if (menuItem.maxQuantityPerOrder && orderItem.quantity > menuItem.maxQuantityPerOrder) {
      //   const response: ApiResponse = {
      //     success: false,
      //     message: `Maximum quantity for '${menuItem.name}' is ${menuItem.maxQuantityPerOrder}`,
      //     messageAr: `الحد الأقصى للكمية لـ '${menuItem.nameAr}' هو ${menuItem.maxQuantityPerOrder}`,
      //   };
      //   return res.status(400).json(response);
      // }
    }

    // Calculate totals with server-side price verification
    let subtotal = 0;
    const orderItemsData = validatedData.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!;
      
      // Always use server-side prices to prevent manipulation
      const price = menuItem.discountPrice || menuItem.price;
      const itemTotal = price * item.quantity;
      
      // Validate reasonable price ranges (prevent extreme prices)
      if (price < 0.01 || price > 10000) {
        throw new Error(`Invalid price detected for item ${menuItem.name}`);
      }
      
      if (itemTotal > 100000) {
        throw new Error(`Item total too high: ${itemTotal} EGP`);
      }
      
      subtotal += itemTotal;
      
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price, // Server-verified price
        notes: item.notes,
      };
    });

    // Validate subtotal is reasonable
    if (subtotal < 0 || subtotal > 1000000) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid order total calculated',
        messageAr: 'إجمالي الطلب المحسوب غير صالح',
      };
      return res.status(400).json(response);
    }

    // Check minimum order
    if (subtotal < restaurant.minimumOrder) {
      const response: ApiResponse = {
        success: false,
        message: `Minimum order amount is ${restaurant.minimumOrder} EGP`,
        messageAr: `الحد الأدنى للطلب هو ${restaurant.minimumOrder} جنيه`,
      };
      return res.status(400).json(response);
    }

    // Apply coupon discount with enhanced validation
    let discount = 0;
    let appliedCoupon = null;
    
    if (validatedData.couponCode && validatedData.couponCode.trim()) {
      // Validate coupon code format
      if (validatedData.couponCode.length > 50) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid coupon code format',
          messageAr: 'تنسيق كود الخصم غير صالح',
        };
        return res.status(400).json(response);
      }

      const coupon = await prisma.coupon.findUnique({
        where: { 
          code: validatedData.couponCode.trim().toUpperCase(),
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (!coupon) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid or expired coupon code',
          messageAr: 'كود خصم غير صالح أو منتهي الصلاحية',
        };
        return res.status(400).json(response);
      }

      // Check usage limits (simplified without user-specific tracking)
      // Note: Implement user-specific coupon usage tracking in database if needed
      // if (coupon.maxUsagePerUser && coupon.usedBy.length >= coupon.maxUsagePerUser) {
      //   const response: ApiResponse = {
      //     success: false,
      //     message: 'You have already used this coupon',
      //     messageAr: 'لقد استخدمت هذا الكوبون من قبل',
      //   };
      //   return res.status(400).json(response);
      // }

      // Check minimum order requirement for coupon
      if (subtotal < coupon.minimumOrder) {
        const response: ApiResponse = {
          success: false,
          message: `Minimum order for this coupon is ${coupon.minimumOrder} EGP`,
          messageAr: `الحد الأدنى للطلب لهذا الكوبون هو ${coupon.minimumOrder} جنيه`,
        };
        return res.status(400).json(response);
      }

      // Check coupon usage limits
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        const response: ApiResponse = {
          success: false,
          message: 'This coupon has reached its usage limit',
          messageAr: 'وصل هذا الكوبون إلى حد الاستخدام',
        };
        return res.status(400).json(response);
      }

      // Calculate discount
      if (coupon.discountType === 'PERCENTAGE') {
        discount = Math.round((subtotal * coupon.discountValue) / 100 * 100) / 100; // Round to 2 decimal places
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }

      // Ensure discount doesn't exceed subtotal
      discount = Math.min(discount, subtotal);
      
      appliedCoupon = coupon;
    }

    // Calculate tax with proper rounding
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.14 * 100) / 100; // 14% tax, rounded to 2 decimal places
    
    // Calculate final total with validation
    const total = Math.round((subtotal + restaurant.deliveryFee + tax - discount) * 100) / 100;
    
    // Validate final calculations
    if (total < 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid order total calculated',
        messageAr: 'إجمالي الطلب المحسوب غير صالح',
      };
      return res.status(400).json(response);
    }

    if (total > 100000) {
      const response: ApiResponse = {
        success: false,
        message: 'Order total exceeds maximum limit',
        messageAr: 'إجمالي الطلب يتجاوز الحد الأقصى',
      };
      return res.status(400).json(response);
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order with items
    const order = await prisma.order.create({
      data: {
        customerId: req.user!.id,
        restaurantId: validatedData.restaurantId,
        addressId: validatedData.addressId,
        orderNumber,
        subtotal,
        deliveryFee: restaurant.deliveryFee,
        tax,
        discount,
        total,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            image: true,
            phone: true,
            ownerId: true,
          },
        },
        address: {
          select: {
            title: true,
            address: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                nameAr: true,
                image: true,
              },
            },
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Update coupon usage
    if (appliedCoupon && discount > 0) {
      await prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usageCount: { increment: 1 } },
      });

      // Note: Implement user-specific coupon usage tracking if needed:
      // await prisma.couponUsage.create({
      //   data: {
      //     couponId: appliedCoupon.id,
      //     userId: req.user!.id,
      //     orderId: order.id,
      //     discountAmount: discount,
      //   },
      // });
    }

    // Update menu item stock if tracked (if field exists)
    // for (const orderItem of orderItemsData) {
    //   const menuItem = menuItems.find(item => item.id === orderItem.menuItemId);
    //   if (menuItem && menuItem.stock !== null) {
    //     await prisma.menuItem.update({
    //       where: { id: orderItem.menuItemId },
    //       data: {
    //         stock: {
    //           decrement: orderItem.quantity,
    //         },
    //       },
    //     });
    //   }
    // }

    // Send real-time notifications with enhanced data
    const notificationData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: `${order.customer.firstName} ${order.customer.lastName}`,
        phone: order.customer.phone,
      },
      total: order.total,
      itemCount: order.items.length,
      estimatedPreparationTime: order.estimatedDeliveryTime,
      address: {
        title: order.address.title,
        address: order.address.address,
        city: order.address.city,
      },
      message: 'New order received',
      messageAr: 'طلب جديد وارد',
      timestamp: new Date().toISOString(),
    };

    // Send to restaurant owner
    io.to(`user_${restaurant.ownerId}`).emit('new_order', notificationData);
    
    // Send to available drivers in the area (if needed)
    io.emit('order_available', {
      orderId: order.id,
      restaurantLocation: {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      },
      deliveryLocation: {
        latitude: order.address.latitude,
        longitude: order.address.longitude,
      },
      total: order.total,
      estimatedDistance: address.latitude && address.longitude ? 
        calculateDistance(restaurant.latitude, restaurant.longitude, address.latitude, address.longitude) : null,
    });

    // Log order creation for audit
    console.log(`✅ Order created successfully: ${order.orderNumber} by user ${req.user!.id} for restaurant ${restaurant.id}`);
    
    await auditHelpers.logOrderOperation(req, 'ORDER_CREATED', order.id, true, {
      orderNumber: order.orderNumber,
      restaurantId: restaurant.id,
      total: order.total,
      paymentMethod: order.paymentMethod,
      itemCount: order.items.length,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Order created successfully',
      messageAr: 'تم إنشاء الطلب بنجاح',
      data: {
        ...order,
        // Include applied coupon info in response
        ...(appliedCoupon && {
          appliedCoupon: {
            code: appliedCoupon.code,
            title: appliedCoupon.title,
            discountAmount: discount,
          },
        }),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Get order by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { customerId: req.user!.id },
          { driverId: req.user!.id },
          { restaurant: { ownerId: req.user!.id } },
          // Admin can see all orders
          ...(req.user!.role === 'ADMIN' ? [{}] : []),
        ],
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            image: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                nameAr: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Order retrieved successfully',
      messageAr: 'تم استرداد الطلب بنجاح',
      data: order,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Update order status (for restaurant owners and drivers)
router.put('/:id/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, estimatedDeliveryTime } = req.body;

    await auditHelpers.logOrderOperation(req, 'UPDATE_ORDER_STATUS_ATTEMPT', id, true, {
      newStatus: status,
      estimatedDeliveryTime,
    });

    if (!status || !Object.values(OrderStatus).includes(status)) {
      const response: ApiResponse = {
        success: false,
        message: 'Valid status is required',
        messageAr: 'حالة صالحة مطلوبة',
      };
      return res.status(400).json(response);
    }

    // Get order with permissions check
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { restaurant: { ownerId: req.user!.id } },
          { driverId: req.user!.id },
          // Admin can update all orders
          ...(req.user!.role === 'ADMIN' ? [{}] : []),
        ],
      },
      include: {
        customer: { select: { id: true, firstName: true } },
        restaurant: { select: { name: true, nameAr: true } },
      },
    });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found or access denied',
        messageAr: 'الطلب غير موجود أو الوصول مرفوض',
      };
      return res.status(404).json(response);
    }

    // Prepare update data
    const updateData: any = { status };
    
    // Set timestamps based on status
    const now = new Date();
    switch (status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = now;
        break;
      case OrderStatus.PREPARING:
        updateData.confirmedAt = updateData.confirmedAt || now;
        break;
      case OrderStatus.READY_FOR_PICKUP:
        updateData.preparedAt = now;
        break;
      case OrderStatus.OUT_FOR_DELIVERY:
        updateData.pickedUpAt = now;
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = now;
        updateData.paymentStatus = PaymentStatus.COMPLETED;
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = now;
        break;
    }

    if (estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await auditHelpers.logOrderOperation(req, 'ORDER_STATUS_UPDATED', id, true, {
      oldStatus: order.status,
      newStatus: status,
      orderNumber: order.orderNumber,
    });

    const statusMessages: Record<string, { en: string; ar: string }> = {
      [OrderStatus.PENDING]: { en: 'Order is pending', ar: 'الطلب في الانتظار' },
      [OrderStatus.CONFIRMED]: { en: 'Order confirmed', ar: 'تم تأكيد الطلب' },
      [OrderStatus.PREPARING]: { en: 'Order is being prepared', ar: 'جاري تحضير الطلب' },
      [OrderStatus.READY_FOR_PICKUP]: { en: 'Order is ready for pickup', ar: 'الطلب جاهز للاستلام' },
      [OrderStatus.OUT_FOR_DELIVERY]: { en: 'Order is out for delivery', ar: 'الطلب في الطريق للتوصيل' },
      [OrderStatus.DELIVERED]: { en: 'Order has been delivered', ar: 'تم توصيل الطلب' },
      [OrderStatus.CANCELLED]: { en: 'Order has been cancelled', ar: 'تم إلغاء الطلب' },
    };

    const messageData = statusMessages[status as OrderStatus] || { en: 'Status updated', ar: 'تم تحديث الحالة' };

    io.to(`user_${order.customer.id}`).emit('order_update', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status,
      message: messageData.en,
      messageAr: messageData.ar,
      estimatedDeliveryTime: updateData.estimatedDeliveryTime,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Order status updated successfully',
      messageAr: 'تم تحديث حالة الطلب بنجاح',
      data: updatedOrder,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Cancel order (customers only, within time limit)
router.put('/:id/cancel', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: req.user!.id,
        status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] },
      },
    });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found or cannot be cancelled',
        messageAr: 'الطلب غير موجود أو لا يمكن إلغاؤه',
      };
      return res.status(404).json(response);
    }

    // Check if order is within cancellation time (e.g., 5 minutes)
    const cancellationTimeLimit = 5 * 60 * 1000; // 5 minutes in milliseconds
    const orderAge = Date.now() - order.createdAt.getTime();
    
    if (orderAge > cancellationTimeLimit && order.status !== OrderStatus.PENDING) {
      const response: ApiResponse = {
        success: false,
        message: 'Order cannot be cancelled after 5 minutes',
        messageAr: 'لا يمكن إلغاء الطلب بعد 5 دقائق',
      };
      return res.status(400).json(response);
    }

    // Cancel order
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by customer',
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Order cancelled successfully',
      messageAr: 'تم إلغاء الطلب بنجاح',
      data: cancelledOrder,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;