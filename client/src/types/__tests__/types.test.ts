import { UserRole } from '../types';
import { OrderStatus } from '../types';
import { PaymentMethod } from '../types';
import { User } from '../types';
import { Restaurant } from '../types';
import { MenuItem } from '../types';
import { Order } from '../types';
import { CartItem } from '../types';
import { Address } from '../types';
import { Review } from '../types';

describe('UserRole', () => {
  it('should have correct values', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.CUSTOMER).toBe('CUSTOMER');
    expect(UserRole.DRIVER).toBe('DRIVER');
    expect(UserRole.RESTAURANT_OWNER).toBe('RESTAURANT_OWNER');
  });
});

describe('OrderStatus', () => {
  it('should have correct values', () => {
    expect(OrderStatus.PENDING).toBe('PENDING');
    expect(OrderStatus.CONFIRMED).toBe('CONFIRMED');
    expect(OrderStatus.PREPARING).toBe('PREPARING');
    expect(OrderStatus.READY).toBe('READY');
    expect(OrderStatus.OUT_FOR_DELIVERY).toBe('OUT_FOR_DELIVERY');
    expect(OrderStatus.DELIVERED).toBe('DELIVERED');
    expect(OrderStatus.CANCELLED).toBe('CANCELLED');
  });
});

describe('PaymentMethod', () => {
  it('should have correct values', () => {
    expect(PaymentMethod.CASH).toBe('CASH');
    expect(PaymentMethod.CREDIT_CARD).toBe('CREDIT_CARD');
    expect(PaymentMethod.ONLINE).toBe('ONLINE');
  });
});

describe('User', () => {
  it('should have correct structure', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'أحمد',
      lastName: 'محمد',
      role: UserRole.CUSTOMER,
      phone: '+201234567890',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('أحمد');
    expect(user.lastName).toBe('محمد');
    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(user.phone).toBe('+201234567890');
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Restaurant', () => {
  it('should have correct structure', () => {
    const restaurant: Restaurant = {
      id: '1',
      name: 'مطعم أسوان',
      nameAr: 'مطعم أسوان',
      description: 'مطعم مصري أصيل',
      descriptionAr: 'مطعم مصري أصيل',
      address: 'أسوان، مصر',
      addressAr: 'أسوان، مصر',
      phone: '+201234567890',
      email: 'info@aswan-restaurant.com',
      rating: 4.5,
      deliveryTime: 30,
      deliveryFee: 15,
      minimumOrder: 50,
      isOpen: true,
      isActive: true,
      image: 'restaurant-image.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(restaurant.id).toBe('1');
    expect(restaurant.name).toBe('مطعم أسوان');
    expect(restaurant.nameAr).toBe('مطعم أسوان');
    expect(restaurant.description).toBe('مطعم مصري أصيل');
    expect(restaurant.rating).toBe(4.5);
    expect(restaurant.deliveryTime).toBe(30);
    expect(restaurant.deliveryFee).toBe(15);
    expect(restaurant.minimumOrder).toBe(50);
    expect(restaurant.isOpen).toBe(true);
    expect(restaurant.isActive).toBe(true);
  });
});

describe('MenuItem', () => {
  it('should have correct structure', () => {
    const menuItem: MenuItem = {
      id: '1',
      restaurantId: '1',
      name: 'كشري',
      nameAr: 'كشري',
      description: 'طبق كشري مصري أصيل',
      descriptionAr: 'طبق كشري مصري أصيل',
      price: 25,
      category: 'أطباق رئيسية',
      categoryAr: 'أطباق رئيسية',
      isAvailable: true,
      isActive: true,
      image: 'koshary-image.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(menuItem.id).toBe('1');
    expect(menuItem.restaurantId).toBe('1');
    expect(menuItem.name).toBe('كشري');
    expect(menuItem.nameAr).toBe('كشري');
    expect(menuItem.description).toBe('طبق كشري مصري أصيل');
    expect(menuItem.price).toBe(25);
    expect(menuItem.category).toBe('أطباق رئيسية');
    expect(menuItem.isAvailable).toBe(true);
    expect(menuItem.isActive).toBe(true);
  });
});

describe('Order', () => {
  it('should have correct structure', () => {
    const order: Order = {
      id: '1',
      userId: '1',
      restaurantId: '1',
      items: [],
      total: 50,
      status: OrderStatus.PENDING,
      deliveryAddress: '123 Main St',
      notes: '',
      paymentMethod: PaymentMethod.CASH,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(order.id).toBe('1');
    expect(order.userId).toBe('1');
    expect(order.restaurantId).toBe('1');
    expect(order.items).toEqual([]);
    expect(order.total).toBe(50);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.deliveryAddress).toBe('123 Main St');
    expect(order.notes).toBe('');
    expect(order.paymentMethod).toBe(PaymentMethod.CASH);
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
  });
});

describe('CartItem', () => {
  it('should have correct structure', () => {
    const cartItem: CartItem = {
      id: '1',
      menuItemId: '1',
      name: 'كشري',
      nameAr: 'كشري',
      price: 25,
      quantity: 2,
      image: 'koshary-image.jpg',
      restaurantId: '1',
      restaurantName: 'مطعم أسوان',
    };

    expect(cartItem.id).toBe('1');
    expect(cartItem.menuItemId).toBe('1');
    expect(cartItem.name).toBe('كشري');
    expect(cartItem.nameAr).toBe('كشري');
    expect(cartItem.price).toBe(25);
    expect(cartItem.quantity).toBe(2);
    expect(cartItem.image).toBe('koshary-image.jpg');
    expect(cartItem.restaurantId).toBe('1');
    expect(cartItem.restaurantName).toBe('مطعم أسوان');
  });
});

describe('Address', () => {
  it('should have correct structure', () => {
    const address: Address = {
      id: '1',
      userId: '1',
      street: 'شارع النيل',
      streetAr: 'شارع النيل',
      city: 'أسوان',
      cityAr: 'أسوان',
      state: 'أسوان',
      stateAr: 'أسوان',
      zipCode: '81511',
      country: 'مصر',
      countryAr: 'مصر',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(address.id).toBe('1');
    expect(address.userId).toBe('1');
    expect(address.street).toBe('شارع النيل');
    expect(address.streetAr).toBe('شارع النيل');
    expect(address.city).toBe('أسوان');
    expect(address.cityAr).toBe('أسوان');
    expect(address.state).toBe('أسوان');
    expect(address.stateAr).toBe('أسوان');
    expect(address.zipCode).toBe('81511');
    expect(address.country).toBe('مصر');
    expect(address.countryAr).toBe('مصر');
    expect(address.isDefault).toBe(true);
  });
});

describe('Review', () => {
  it('should have correct structure', () => {
    const review: Review = {
      id: '1',
      userId: '1',
      restaurantId: '1',
      orderId: '1',
      rating: 5,
      comment: 'طعام ممتاز',
      commentAr: 'طعام ممتاز',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(review.id).toBe('1');
    expect(review.userId).toBe('1');
    expect(review.restaurantId).toBe('1');
    expect(review.orderId).toBe('1');
    expect(review.rating).toBe(5);
    expect(review.comment).toBe('طعام ممتاز');
    expect(review.commentAr).toBe('طعام ممتاز');
    expect(review.createdAt).toBeInstanceOf(Date);
    expect(review.updatedAt).toBeInstanceOf(Date);
  });
});