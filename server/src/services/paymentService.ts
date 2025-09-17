import Stripe from 'stripe';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '../index';
import { AppError } from '../types';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Payment service interface
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: string;
}

// Create payment intent for card payments
export const createPaymentIntent = async (
  orderId: string,
  amount: number,
  currency: string = 'egp',
  customerId?: string
): Promise<PaymentIntent> => {
  try {
    // Validate amount (minimum 50 piasters in Egypt)
    if (amount < 0.50) {
      throw new AppError('Payment amount too small', 400, 'مبلغ الدفع صغير جداً');
    }

    if (amount > 100000) {
      throw new AppError('Payment amount too large', 400, 'مبلغ الدفع كبير جداً');
    }

    // Get order details for metadata
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { email: true, firstName: true, lastName: true },
        },
        restaurant: {
          select: { name: true },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'الطلب غير موجود');
    }

    // Create Stripe customer if not exists
    let stripeCustomerId = customerId;
    if (!stripeCustomerId && order.customer.email) {
      try {
        const customer = await stripe.customers.create({
          email: order.customer.email,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          metadata: {
            userId: order.customerId,
          },
        });
        stripeCustomerId = customer.id;

        // Note: Add stripeCustomerId field to User model in schema if needed
        // await prisma.user.update({
        //   where: { id: order.customerId },
        //   data: { stripeCustomerId: customer.id },
        // });
      } catch (error) {
        console.warn('Failed to create Stripe customer:', error);
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to piasters/cents
      currency: currency.toLowerCase(),
      customer: stripeCustomerId || undefined,
      payment_method_types: ['card'],
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurantName: order.restaurant.name,
        customerEmail: order.customer.email,
      },
      description: `Payment for order ${order.orderNumber} from ${order.restaurant.name}`,
      statement_descriptor: 'ASWAN FOOD DELIVERY',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    console.log(`💳 Payment intent created: ${paymentIntent.id} for order ${order.orderNumber}`);

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new AppError(
        `Payment processing error: ${error.message}`,
        400,
        'خطأ في معالجة الدفع'
      );
    }
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Failed to process payment',
      500,
      'فشل في معالجة الدفع'
    );
  }
};

// Confirm payment intent
export const confirmPaymentIntent = async (
  paymentIntentId: string
): Promise<{ status: string; orderId?: string }> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.metadata.orderId) {
      throw new AppError('Invalid payment intent', 400, 'هوية دفع غير صالحة');
    }

    const orderId = paymentIntent.metadata.orderId;

    // Update order payment status based on payment intent status
    let paymentStatus: PaymentStatus;
    switch (paymentIntent.status) {
      case 'succeeded':
        paymentStatus = PaymentStatus.COMPLETED;
        break;
      case 'processing':
        paymentStatus = PaymentStatus.PENDING;
        break;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        paymentStatus = PaymentStatus.PENDING;
        break;
      case 'canceled':
        paymentStatus = PaymentStatus.FAILED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        ...(paymentIntent.status === 'succeeded' && {
          paidAt: new Date(),
        }),
      },
    });

    console.log(`💳 Payment ${paymentIntentId} ${paymentIntent.status} for order ${orderId}`);

    return {
      status: paymentIntent.status,
      orderId,
    };
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Failed to confirm payment',
      500,
      'فشل في تأكيد الدفع'
    );
  }
};

// Process refund
export const processRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(
        'Cannot refund unpaid or failed payment',
        400,
        'لا يمكن استرداد دفع غير مكتمل أو فاشل'
      );
    }

    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer',
      metadata: {
        orderId: paymentIntent.metadata.orderId,
        processedAt: new Date().toISOString(),
      },
    });

    // Update order payment status
    if (paymentIntent.metadata.orderId) {
      await prisma.order.update({
        where: { id: paymentIntent.metadata.orderId },
        data: {
          paymentStatus: refund.amount === paymentIntent.amount 
            ? PaymentStatus.REFUNDED 
            : PaymentStatus.COMPLETED, // Keep as completed for partial refunds
          // Note: Add these fields to Order model if needed:
          // refundedAt: new Date(),
          // refundAmount: refund.amount / 100,
          // refundReason: reason,
        },
      });
    }

    console.log(`💰 Refund processed: ${refund.id} for payment ${paymentIntentId}`);

    return {
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status || 'unknown',
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new AppError(
        `Refund processing error: ${error.message}`,
        400,
        'خطأ في معالجة الاسترداد'
      );
    }
    
    throw new AppError(
      'Failed to process refund',
      500,
      'فشل في معالجة الاسترداد'
    );
  }
};

// Handle webhook events
export const handleStripeWebhook = async (
  signature: string,
  payload: Buffer
): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    console.log(`🎣 Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    throw new AppError('Invalid webhook signature', 400);
  }
};

// Handle successful payment
const handlePaymentSucceeded = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) {
    console.warn('Payment succeeded but no order ID in metadata');
    return;
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        // Note: Add paidAt field to Order model if needed
        // paidAt: new Date(),
      },
    });

    console.log(`✅ Payment completed for order ${orderId}`);
  } catch (error) {
    console.error(`Failed to update order ${orderId} payment status:`, error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) return;

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        // Note: Add paymentError field to Order model if needed
        // paymentError: paymentIntent.last_payment_error?.message,
      },
    });

    console.log(`❌ Payment failed for order ${orderId}`);
  } catch (error) {
    console.error(`Failed to update order ${orderId} payment status:`, error);
  }
};

// Handle canceled payment
const handlePaymentCanceled = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) return;

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        // Note: Add paymentError field to Order model if needed
        // paymentError: 'Payment was canceled',
      },
    });

    console.log(`🚫 Payment canceled for order ${orderId}`);
  } catch (error) {
    console.error(`Failed to update order ${orderId} payment status:`, error);
  }
};

// Handle charge dispute
const handleChargeDispute = async (dispute: Stripe.Dispute): Promise<void> => {
  console.log(`⚠️ Charge dispute created: ${dispute.id} for ${dispute.amount / 100} ${dispute.currency}`);
  
  // You might want to implement notification system here
  // For now, just log the dispute
};

// Validate Stripe webhook signature
export const validateWebhookSignature = (
  signature: string,
  payload: Buffer
): boolean => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return false;
  }

  try {
    stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return true;
  } catch (error) {
    return false;
  }
};

// Get payment method details
export const getPaymentMethodDetails = async (
  paymentMethodId: string
): Promise<any> => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      } : null,
    };
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    return null;
  }
};

export default {
  createPaymentIntent,
  confirmPaymentIntent,
  processRefund,
  handleStripeWebhook,
  validateWebhookSignature,
  getPaymentMethodDetails,
};