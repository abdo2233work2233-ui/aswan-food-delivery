import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../index';
import { SocketUser, OrderUpdate } from '../types';
import { UserRole } from '@prisma/client';

// Store connected users
const connectedUsers = new Map<string, SocketUser>();

export const initializeSocket = (io: Server) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      
      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      socket.data.user = {
        id: user.id,
        role: user.role,
      };

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`🔌 User connected: ${user.id} (${user.role})`);

    // Store connected user
    connectedUsers.set(socket.id, {
      id: user.id,
      role: user.role,
      socketId: socket.id,
    });

    // Join user to their personal room
    socket.join(`user_${user.id}`);

    // Join role-specific rooms
    socket.join(`role_${user.role}`);

    // Handle location updates (for delivery drivers)
    socket.on('location_update', async (data: { latitude: number; longitude: number; orderId?: string }): Promise<void> => {
      if (user.role !== UserRole.DELIVERY_DRIVER) {
        socket.emit('error', { message: 'Only delivery drivers can send location updates' });
        return;
      }

      try {
        const { latitude, longitude, orderId } = data;

        // Validate coordinates
        if (!latitude || !longitude || 
            latitude < -90 || latitude > 90 || 
            longitude < -180 || longitude > 180) {
          socket.emit('error', { message: 'Invalid coordinates' });
          return;
        }

        // If orderId is provided, notify the customer
        if (orderId) {
          const order = await prisma.order.findFirst({
            where: {
              id: orderId,
              driverId: user.id,
              status: 'OUT_FOR_DELIVERY',
            },
            select: {
              customerId: true,
              orderNumber: true,
            },
          });

          if (order) {
            io.to(`user_${order.customerId}`).emit('driver_location', {
              orderId,
              orderNumber: order.orderNumber,
              driverLocation: { latitude, longitude },
              timestamp: new Date(),
            });
          }
        }

        // Broadcast to admin dashboard
        io.to('role_ADMIN').emit('driver_location_update', {
          driverId: user.id,
          location: { latitude, longitude },
          orderId,
          timestamp: new Date(),
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to process location update' });
      }
    });

    // Handle order status updates
    socket.on('order_status_update', async (data: { orderId: string; status: string; message?: string }): Promise<void> => {
      try {
        const { orderId, status, message } = data;

        // Verify user has permission to update this order
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            OR: [
              { restaurant: { ownerId: user.id } },
              { driverId: user.id },
              ...(user.role === UserRole.ADMIN ? [{}] : []),
            ],
          },
          select: {
            customerId: true,
            orderNumber: true,
            restaurant: { select: { name: true, nameAr: true } },
          },
        });

        if (!order) {
          socket.emit('error', { message: 'Order not found or access denied' });
          return;
        }

        // Send update to customer
        const orderUpdate: OrderUpdate = {
          orderId,
          status,
          message: message || `Order status updated to ${status}`,
          messageAr: message || `تم تحديث حالة الطلب إلى ${status}`,
        };

        io.to(`user_${order.customerId}`).emit('order_update', orderUpdate);

        // Notify admins
        io.to('role_ADMIN').emit('order_status_changed', {
          orderId,
          orderNumber: order.orderNumber,
          status,
          updatedBy: user.id,
          restaurant: order.restaurant,
          timestamp: new Date(),
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });

    // Handle driver availability updates
    socket.on('driver_availability', async (data: { isAvailable: boolean }): Promise<void> => {
      if (user.role !== UserRole.DELIVERY_DRIVER) {
        socket.emit('error', { message: 'Only delivery drivers can update availability' });
        return;
      }

      try {
        // Update driver availability in database (you might want to add this field to User model)
        // await prisma.user.update({
        //   where: { id: user.id },
        //   data: { isAvailable: data.isAvailable },
        // });

        // Notify admins and restaurant owners about driver availability
        io.to('role_ADMIN').to('role_RESTAURANT_OWNER').emit('driver_availability_update', {
          driverId: user.id,
          isAvailable: data.isAvailable,
          timestamp: new Date(),
        });

        socket.emit('availability_updated', { isAvailable: data.isAvailable });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update availability' });
      }
    });

    // Handle new order notifications (for restaurant owners)
    socket.on('join_restaurant', async (data: { restaurantId: string }): Promise<void> => {
      if (user.role !== UserRole.RESTAURANT_OWNER && user.role !== UserRole.ADMIN) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      try {
        // Verify restaurant ownership
        if (user.role === UserRole.RESTAURANT_OWNER) {
          const restaurant = await prisma.restaurant.findFirst({
            where: {
              id: data.restaurantId,
              ownerId: user.id,
            },
          });

          if (!restaurant) {
            socket.emit('error', { message: 'Restaurant not found or access denied' });
            return;
          }
        }

        socket.join(`restaurant_${data.restaurantId}`);
        socket.emit('joined_restaurant', { restaurantId: data.restaurantId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join restaurant room' });
      }
    });

    // Handle chat messages (between customer, restaurant, and driver)
    socket.on('send_message', async (data: { 
      orderId: string; 
      message: string; 
      recipientRole: 'customer' | 'restaurant' | 'driver';
    }): Promise<void> => {
      try {
        const { orderId, message, recipientRole } = data;

        // Verify user is part of this order
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            OR: [
              { customerId: user.id },
              { driverId: user.id },
              { restaurant: { ownerId: user.id } },
              ...(user.role === UserRole.ADMIN ? [{}] : []),
            ],
          },
          select: {
            customerId: true,
            driverId: true,
            restaurant: { select: { ownerId: true } },
          },
        });

        if (!order) {
          socket.emit('error', { message: 'Order not found or access denied' });
          return;
        }

        // Determine recipient
        let recipientId: string | null = null;
        switch (recipientRole) {
          case 'customer':
            recipientId = order.customerId;
            break;
          case 'restaurant':
            recipientId = order.restaurant.ownerId;
            break;
          case 'driver':
            recipientId = order.driverId;
            break;
        }

        if (!recipientId) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        // Send message
        const messageData = {
          orderId,
          senderId: user.id,
          senderRole: user.role,
          message,
          timestamp: new Date(),
        };

        io.to(`user_${recipientId}`).emit('new_message', messageData);
        socket.emit('message_sent', messageData);

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${user.id} (${reason})`);
      connectedUsers.delete(socket.id);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Successfully connected to Aswan Food real-time service',
      messageAr: 'تم الاتصال بنجاح بخدمة أسوان فود في الوقت الفعلي',
      userId: user.id,
      role: user.role,
    });
  });

  // Helper function to send notification to specific user
  const sendNotificationToUser = (userId: string, notification: any) => {
    io.to(`user_${userId}`).emit('notification', notification);
  };

  // Helper function to broadcast to all users of a specific role
  const broadcastToRole = (role: UserRole, data: any) => {
    io.to(`role_${role}`).emit('broadcast', data);
  };

  return {
    sendNotificationToUser,
    broadcastToRole,
    getConnectedUsers: () => Array.from(connectedUsers.values()),
    getConnectedUsersByRole: (role: UserRole) => 
      Array.from(connectedUsers.values()).filter(user => user.role === role),
  };
};