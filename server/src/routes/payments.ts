import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, AuthenticatedRequest } from '../types';
import paymentService from '../services/paymentService';
import { prisma } from '../index';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

const router = express.Router();

// Create payment intent for card payments
router.post('/create-intent', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      const response: ApiResponse = {
        success: false,
        message: 'Order ID is required',
        messageAr: 'معرف الطلب مطلوب',
      };
      return res.status(400).json(response);
    }

    // Verify order belongs to user and requires card payment
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: req.user!.id,
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: 'Order not found or payment not required',
        messageAr: 'الطلب غير موجود أو الدفع غير مطلوب',
      };
      return res.status(404).json(response);
    }

    // Check if payment intent already exists
    if (order.paymentIntentId) {
      try {
        // Try to retrieve existing payment intent
        const existingIntent = await paymentService.confirmPaymentIntent(order.paymentIntentId);
        
        if (existingIntent.status === 'succeeded') {
          const response: ApiResponse = {
            success: false,
            message: 'Order is already paid',
            messageAr: 'تم دفع الطلب بالفعل',
          };
          return res.status(400).json(response);
        }
        
        // Return existing payment intent if still valid
        const response: ApiResponse = {
          success: true,
          message: 'Payment intent retrieved',
          messageAr: 'تم استرداد هوية الدفع',
          data: {
            paymentIntentId: order.paymentIntentId,
            // Note: You may need to get client secret from Stripe API
          },
        };
        return res.json(response);
      } catch (error) {
        // Continue to create new payment intent if existing one is invalid
        console.warn('Existing payment intent invalid, creating new one');
      }
    }

    // Create new payment intent
    const paymentIntent = await paymentService.createPaymentIntent(
      order.id,
      order.total,
      'egp'
    );

    const response: ApiResponse = {
      success: true,
      message: 'Payment intent created successfully',
      messageAr: 'تم إنشاء هوية الدفع بنجاح',
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Confirm payment completion
router.post('/confirm/:orderId', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { orderId } = req.params;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: req.user!.id,
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

    if (!order.paymentIntentId) {
      const response: ApiResponse = {
        success: false,
        message: 'No payment intent found for this order',
        messageAr: 'لا توجد هوية دفع لهذا الطلب',
      };
      return res.status(400).json(response);
    }

    // Confirm payment with Stripe
    const result = await paymentService.confirmPaymentIntent(order.paymentIntentId);

    const response: ApiResponse = {
      success: true,
      message: 'Payment status confirmed',
      messageAr: 'تم تأكيد حالة الدفع',
      data: {
        paymentStatus: result.status,
        orderId: result.orderId,
      },
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Get payment status
router.get('/status/:orderId', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { orderId } = req.params;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: req.user!.id,
      },
      select: {
        id: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentIntentId: true,
        total: true,
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
      message: 'Payment status retrieved',
      messageAr: 'تم استرداد حالة الدفع',
      data: {
        orderId: order.id,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: order.total,
        requiresPayment: order.paymentMethod === PaymentMethod.CARD && 
                        order.paymentStatus === PaymentStatus.PENDING,
      },
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Request refund (admin only or within cancellation window)
router.post('/refund/:orderId', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    // Get order with payment details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { customerId: req.user!.id },
          // Admin access (implement admin role check if needed)
        ],
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true },
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

    // Check if order is eligible for refund
    if (order.paymentStatus !== PaymentStatus.COMPLETED) {
      const response: ApiResponse = {
        success: false,
        message: 'Order payment is not completed, cannot process refund',
        messageAr: 'دفع الطلب غير مكتمل، لا يمكن معالجة الاسترداد',
      };
      return res.status(400).json(response);
    }

    if (!order.paymentIntentId) {
      const response: ApiResponse = {
        success: false,
        message: 'No payment record found for this order',
        messageAr: 'لا يوجد سجل دفع لهذا الطلب',
      };
      return res.status(400).json(response);
    }

    // Check if refund is within allowed timeframe (e.g., 24 hours)
    const orderAge = Date.now() - order.createdAt.getTime();
    const refundWindow = 24 * 60 * 60 * 1000; // 24 hours
    
    if (orderAge > refundWindow && req.user!.role !== 'ADMIN') {
      const response: ApiResponse = {
        success: false,
        message: 'Refund window has expired (24 hours)',
        messageAr: 'انتهت فترة الاسترداد (24 ساعة)',
      };
      return res.status(400).json(response);
    }

    // Process refund
    const refundResult = await paymentService.processRefund(
      order.paymentIntentId,
      undefined, // Full refund
      reason
    );

    console.log(`💰 Refund processed for order ${orderId} by user ${req.user!.id}`);

    const response: ApiResponse = {
      success: true,
      message: 'Refund processed successfully',
      messageAr: 'تم معالجة الاسترداد بنجاح',
      data: {
        refundId: refundResult.id,
        amount: refundResult.amount,
        status: refundResult.status,
        orderId: order.id,
      },
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Handle webhook
    await paymentService.handleStripeWebhook(signature, req.body);

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

export default router;