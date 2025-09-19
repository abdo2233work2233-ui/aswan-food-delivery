import express from 'express';
import { prisma } from '../index';
import { ApiResponse } from '../types';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get featured restaurants (مطاعم مميزة)
router.get('/featured', optionalAuth, async (req, res, next) => {
  try {
    const featuredRestaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        rating: {
          gte: 4.5
        }
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        descriptionAr: true,
        image: true,
        coverImage: true,
        address: true,
        rating: true,
        totalReviews: true,
        deliveryTime: true,
        deliveryFee: true,
        minimumOrder: true,
        isOpen: true,
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameAr: true,
            menuItems: {
              where: { isAvailable: true, isPopular: true },
              take: 3,
              select: {
                id: true,
                name: true,
                nameAr: true,
                image: true,
                price: true,
                discountPrice: true,
              },
            },
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' }
      ],
      take: 8
    });

    const response: ApiResponse = {
      success: true,
      message: 'Featured restaurants retrieved successfully',
      messageAr: 'تم استرداد المطاعم المميزة بنجاح',
      data: featuredRestaurants,
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Get trending menu items (أطباق رائجة)
router.get('/trending', optionalAuth, async (req, res, next) => {
  try {
    const { limit = 12 } = req.query;

    const trendingItems = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        isPopular: true,
        restaurant: {
          isActive: true,
          isOpen: true,
        },
      },
      take: Number(limit),
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        descriptionAr: true,
        image: true,
        price: true,
        discountPrice: true,
        preparationTime: true,
        calories: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            image: true,
            rating: true,
            deliveryTime: true,
            deliveryFee: true,
          },
        },
        category: {
          select: {
            name: true,
            nameAr: true,
          },
        },
      },
      orderBy: [
        { restaurant: { rating: 'desc' } },
        { name: 'asc' },
      ],
    });

    const response: ApiResponse = {
      success: true,
      message: 'Trending items retrieved successfully',
      messageAr: 'تم استرداد الأطباق الرائجة بنجاح',
      data: trendingItems,
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Get restaurants by category (مطاعم حسب الفئة)
router.get('/by-category/:category', optionalAuth, async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        categories: {
          some: {
            nameAr: {
              contains: category,
              mode: 'insensitive'
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        descriptionAr: true,
        image: true,
        address: true,
        rating: true,
        totalReviews: true,
        deliveryTime: true,
        deliveryFee: true,
        minimumOrder: true,
        isOpen: true,
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameAr: true,
            menuItems: {
              where: { isAvailable: true },
              take: 2,
              select: {
                id: true,
                name: true,
                nameAr: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
      skip,
      take: Number(limit),
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' }
      ],
    });

    const total = await prisma.restaurant.count({
      where: {
        isActive: true,
        categories: {
          some: {
            nameAr: {
              contains: category,
              mode: 'insensitive'
            }
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Restaurants by category retrieved successfully',
      messageAr: 'تم استرداد المطاعم حسب الفئة بنجاح',
      data: {
        restaurants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
      },
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Get recommended items (توصيات شخصية)
router.get('/recommended', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { limit = 8 } = req.query;

    // Get user's order history to make recommendations
    const userOrders = await prisma.order.findMany({
      where: {
        customerId: userId,
        status: 'DELIVERED'
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Extract user preferences
    const userPreferences = new Set();
    userOrders.forEach(order => {
      order.orderItems.forEach(item => {
        userPreferences.add(item.menuItem.category.nameAr);
      });
    });

    // Get recommended items based on preferences
    const recommendedItems = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        restaurant: {
          isActive: true,
          isOpen: true,
        },
        category: {
          nameAr: {
            in: Array.from(userPreferences)
          }
        }
      },
      take: Number(limit),
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        descriptionAr: true,
        image: true,
        price: true,
        discountPrice: true,
        preparationTime: true,
        isPopular: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            image: true,
            rating: true,
            deliveryTime: true,
          },
        },
        category: {
          select: {
            name: true,
            nameAr: true,
          },
        },
      },
      orderBy: [
        { isPopular: 'desc' },
        { restaurant: { rating: 'desc' } },
      ],
    });

    const response: ApiResponse = {
      success: true,
      message: 'Recommended items retrieved successfully',
      messageAr: 'تم استرداد التوصيات بنجاح',
      data: recommendedItems,
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Bulk create restaurants (إنشاء جماعي للمطاعم)
router.post('/bulk-create', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized access',
        messageAr: 'وصول غير مصرح به',
      };
      return res.status(403).json(response);
    }

    const { restaurants } = req.body;

    if (!restaurants || !Array.isArray(restaurants)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid restaurants data',
        messageAr: 'بيانات المطاعم غير صحيحة',
      };
      return res.status(400).json(response);
    }

    const createdRestaurants = await Promise.all(
      restaurants.map(async (restaurantData: any) => {
        const restaurant = await prisma.restaurant.create({
          data: restaurantData,
        });
        return restaurant;
      })
    );

    const response: ApiResponse = {
      success: true,
      message: 'Restaurants created successfully',
      messageAr: 'تم إنشاء المطاعم بنجاح',
      data: createdRestaurants,
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Enhanced search with filters
router.get('/search/enhanced', optionalAuth, async (req, res, next) => {
  try {
    const { 
      query, 
      category, 
      minPrice, 
      maxPrice, 
      rating, 
      deliveryTime,
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build search conditions
    const whereConditions: any = {
      isActive: true,
    };

    if (query) {
      whereConditions.OR = [
        { name: { contains: query as string, mode: 'insensitive' } },
        { nameAr: { contains: query as string, mode: 'insensitive' } },
        { description: { contains: query as string, mode: 'insensitive' } },
        { descriptionAr: { contains: query as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereConditions.categories = {
        some: {
          nameAr: {
            contains: category as string,
            mode: 'insensitive'
          }
        }
      };
    }

    if (rating) {
      whereConditions.rating = {
        gte: Number(rating)
      };
    }

    if (deliveryTime) {
      whereConditions.deliveryTime = {
        lte: Number(deliveryTime)
      };
    }

    const restaurants = await prisma.restaurant.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        descriptionAr: true,
        image: true,
        address: true,
        rating: true,
        totalReviews: true,
        deliveryTime: true,
        deliveryFee: true,
        minimumOrder: true,
        isOpen: true,
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameAr: true,
            menuItems: {
              where: { 
                isAvailable: true,
                ...(minPrice && { price: { gte: Number(minPrice) } }),
                ...(maxPrice && { price: { lte: Number(maxPrice) } }),
              },
              take: 3,
              select: {
                id: true,
                name: true,
                nameAr: true,
                image: true,
                price: true,
                discountPrice: true,
              },
            },
          },
        },
      },
      skip,
      take: Number(limit),
      orderBy: [
        { rating: 'desc' },
        { deliveryTime: 'asc' },
        { name: 'asc' }
      ],
    });

    const total = await prisma.restaurant.count({
      where: whereConditions
    });

    const response: ApiResponse = {
      success: true,
      message: 'Enhanced search completed successfully',
      messageAr: 'تم البحث المحسن بنجاح',
      data: {
        restaurants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
        filters: {
          query,
          category,
          minPrice,
          maxPrice,
          rating,
          deliveryTime,
        },
      },
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;
