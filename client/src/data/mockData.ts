// Mock data for development/testing
export const mockRestaurants = [
  {
    id: '1',
    name: 'Aswan Traditional Restaurant',
    nameAr: 'مطعم أسوان التقليدي',
    description: 'Authentic Egyptian cuisine with traditional flavors',
    descriptionAr: 'مأكولات مصرية أصيلة بنكهات تقليدية',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop&crop=center',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop&crop=center',
    address: 'Corniche El Nile, Aswan',
    latitude: 24.0889,
    longitude: 32.8998,
    phone: '+20 97 230 1234',
    email: 'info@aswantraditional.com',
    isActive: true,
    isOpen: true,
    deliveryTime: 30,
    deliveryFee: 15,
    minimumOrder: 50,
    rating: 4.5,
    totalReviews: 128,
    openingTime: '10:00',
    closingTime: '23:00',
    categories: [
      {
        id: 'cat1',
        restaurantId: '1',
        name: 'Main Dishes',
        nameAr: 'الأطباق الرئيسية',
        description: 'Traditional main courses',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300',
        sortOrder: 1,
        isActive: true,
        menuItems: [
          {
            id: 'item1',
            restaurantId: '1',
            categoryId: 'cat1',
            name: 'Koshari',
            nameAr: 'كشري',
            description: 'Traditional Egyptian dish with rice, lentils, and pasta',
            descriptionAr: 'طبق مصري تقليدي مع الأرز والعدس والمعكرونة',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
            price: 25,
            discountPrice: 20,
            isAvailable: true,
            isPopular: true,
            ingredients: 'Rice, lentils, pasta, chickpeas, fried onions, tomato sauce',
            allergens: undefined,
            calories: 450,
            preparationTime: 15,
            sortOrder: 1
          },
          {
            id: 'item2',
            restaurantId: '1',
            categoryId: 'cat1',
            name: 'Ful Medames',
            nameAr: 'فول مدمس',
            description: 'Slow-cooked fava beans with olive oil and spices',
            descriptionAr: 'فول مدمس مطبوخ ببطء مع زيت الزيتون والتوابل',
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&crop=center',
            price: 18,
            discountPrice: undefined,
            isAvailable: true,
            isPopular: false,
            ingredients: 'Fava beans, olive oil, garlic, lemon, cumin',
            allergens: undefined,
            calories: 320,
            preparationTime: 10,
            sortOrder: 2
          }
        ]
      },
      {
        id: 'cat2',
        restaurantId: '1',
        name: 'Desserts',
        nameAr: 'الحلويات',
        description: 'Traditional Egyptian desserts',
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300',
        sortOrder: 2,
        isActive: true,
        menuItems: [
          {
            id: 'item3',
            restaurantId: '1',
            categoryId: 'cat2',
            name: 'Baklava',
            nameAr: 'بقلاوة',
            description: 'Sweet pastry with nuts and honey',
            descriptionAr: 'معجنات حلوة مع المكسرات والعسل',
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop&crop=center',
            price: 35,
            discountPrice: undefined,
            isAvailable: true,
            isPopular: true,
            ingredients: 'Phyllo dough, nuts, honey, butter',
            allergens: undefined,
            calories: 280,
            preparationTime: 5,
            sortOrder: 1
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Nile View Cafe',
    nameAr: 'مقهى منظر النيل',
    description: 'Modern cafe with Nile River views',
    descriptionAr: 'مقهى حديث مع إطلالة على نهر النيل',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&h=300&fit=crop&crop=center',
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=400&fit=crop&crop=center',
    address: 'Nile Corniche, Aswan',
    latitude: 24.0889,
    longitude: 32.8998,
    phone: '+20 97 230 5678',
    email: 'info@nileviewcafe.com',
    isActive: true,
    isOpen: true,
    deliveryTime: 25,
    deliveryFee: 10,
    minimumOrder: 30,
    rating: 4.2,
    totalReviews: 89,
    openingTime: '08:00',
    closingTime: '24:00',
    categories: [
      {
        id: 'cat3',
        restaurantId: '2',
        name: 'Beverages',
        nameAr: 'المشروبات',
        description: 'Hot and cold beverages',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300',
        sortOrder: 1,
        isActive: true,
        menuItems: [
          {
            id: 'item4',
            restaurantId: '2',
            categoryId: 'cat3',
            name: 'Turkish Coffee',
            nameAr: 'قهوة تركية',
            description: 'Traditional Turkish coffee',
            descriptionAr: 'قهوة تركية تقليدية',
            image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop&crop=center',
            price: 12,
            discountPrice: undefined,
            isAvailable: true,
            isPopular: true,
            ingredients: 'Coffee beans, water, sugar',
            allergens: undefined,
            calories: 5,
            preparationTime: 5,
            sortOrder: 1
          }
        ]
      }
    ]
  }
];

export const mockMenuItems = mockRestaurants.flatMap(restaurant => 
  restaurant.categories?.flatMap(category => category.menuItems || []) || []
) as any[];

export const mockUsers = [
  {
    id: 'user1',
    email: 'customer@example.com',
    phone: '+20 97 230 9999',
    firstName: 'Ahmed',
    lastName: 'Hassan',
    role: 'CUSTOMER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    addresses: [
      {
        id: 'addr1',
        userId: 'user1',
        title: 'Home',
        address: '123 Nile Street, Aswan',
        city: 'Aswan',
        governorate: 'Aswan',
        latitude: 24.0889,
        longitude: 32.8998,
        isDefault: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
    ]
  }
];
