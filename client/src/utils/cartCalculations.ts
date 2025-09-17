import { Cart, Restaurant } from '../types';

// Calculate delivery fee based on subtotal and restaurant fees
export const calculateDeliveryFee = (subtotal: number, restaurants: Restaurant[]): number => {
  // If subtotal is 100 or more, delivery is free
  if (subtotal >= 100) {
    return 0;
  }
  
  // If subtotal is less than 100, use the highest delivery fee among all restaurants
  const maxDeliveryFee = Math.max(...restaurants.map(r => r.deliveryFee), 0);
  return maxDeliveryFee;
};

// Calculate tax (14% VAT in Egypt)
export const calculateTax = (subtotal: number, deliveryFee: number, discount: number = 0): number => {
  const taxableAmount = subtotal + deliveryFee - discount;
  return Math.round(taxableAmount * 0.14 * 100) / 100; // Round to 2 decimal places
};

// Calculate total order amount
export const calculateTotal = (subtotal: number, deliveryFee: number, tax: number, discount: number = 0): number => {
  return subtotal + deliveryFee + tax - discount;
};

// Get all restaurants from cart items
export const getRestaurantsFromCart = (cart: Cart): Restaurant[] => {
  const restaurants: Restaurant[] = [];
  
  // If cart has a restaurant, use it
  if (cart.restaurant) {
    restaurants.push(cart.restaurant);
    return restaurants;
  }
  
  // If no restaurant in cart, create a default restaurant with delivery fee
  // This is a fallback for when restaurant info is not available
  const defaultRestaurant: Restaurant = {
    id: 'default',
    name: 'Restaurant',
    nameAr: 'مطعم',
    description: 'Default restaurant',
    descriptionAr: 'مطعم افتراضي',
    image: '',
    coverImage: '',
    address: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    email: '',
    isActive: true,
    isOpen: true,
    deliveryTime: 30,
    deliveryFee: 15, // Default delivery fee
    minimumOrder: 50,
    rating: 4.5,
    totalReviews: 0,
    openingTime: '09:00',
    closingTime: '23:00',
  };
  
  restaurants.push(defaultRestaurant);
  return restaurants;
};
