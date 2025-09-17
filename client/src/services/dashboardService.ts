import { apiClient } from './api';
import { MenuItem, Restaurant, Category, User, UserRole } from '../types';
import { getRestaurantsStore, setRestaurantsStore } from '../data/runtimeData';
import { addUser, deleteUser, getUsersPublic, updateUser } from '../data/runtimeUsers';

// Check if API is available
const isApiAvailable = async (): Promise<boolean> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://aswan-food-delivery.onrender.com';
    const response = await fetch(`${apiUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// Use API if available, otherwise fallback to mock
let MOCK_ENABLED = true; // Will be updated dynamically

// Initialize API availability check
isApiAvailable().then(available => {
  MOCK_ENABLED = !available;
});

// Restaurant Owner Functions
export const restaurantOwnerService = {
  // Get list of all restaurants (Owner has full control)
  getAllRestaurants: async (): Promise<Restaurant[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getRestaurantsStore() as any);
      }, 300);
    });
  },

  // Get restaurant categories
  getRestaurantCategories: async (restaurantId: string): Promise<Category[]> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const restaurant = (getRestaurantsStore() as any[]).find(r => r.id === restaurantId);
        if (!restaurant) {
          reject(new Error('Restaurant not found'));
          return;
        }
        resolve((restaurant.categories || []) as Category[]);
      }, 300);
    });
  },

  // Get all menu items for a restaurant
  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const restaurant = (getRestaurantsStore() as any[]).find(r => r.id === restaurantId);
        if (!restaurant) {
          reject(new Error('Restaurant not found'));
          return;
        }
        const items: MenuItem[] = [];
        (restaurant.categories || []).forEach((c: any) => {
          (c.menuItems || []).forEach((mi: any) => items.push(mi as MenuItem));
        });
        resolve(items);
      }, 300);
    });
  },

  // Add new menu item
  addMenuItem: async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const restaurants = getRestaurantsStore() as any[];
        const restaurant = restaurants.find(r => r.id === menuItem.restaurantId);
        if (!restaurant) {
          reject(new Error('Restaurant not found'));
          return;
        }
        const newItem: MenuItem = {
          ...menuItem,
          id: Date.now().toString()
        } as MenuItem;

        // Find target category; if missing, create a fallback category
        let category = (restaurant.categories || []).find((c: any) => c.id === newItem.categoryId);
        if (!category) {
          const incomingCategory: any = (menuItem as any).category;
          const fallbackCategory: Category = {
            id: newItem.categoryId || (incomingCategory?.id || 'uncategorized'),
            restaurantId: restaurant.id,
            name: incomingCategory?.name || 'Other',
            nameAr: incomingCategory?.nameAr || 'أخرى',
            description: incomingCategory?.description || 'Miscellaneous items',
            image: incomingCategory?.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300',
            sortOrder: incomingCategory?.sortOrder || 99,
            isActive: true,
            menuItems: []
          };
          const updatedRestaurant = {
            ...restaurant,
            categories: restaurant.categories ? [...restaurant.categories, fallbackCategory] : [fallbackCategory]
          };
          const next = restaurants.map(r => (r.id === restaurant.id ? updatedRestaurant : r));
          setRestaurantsStore(next);
          category = (updatedRestaurant.categories as any[]).find(c => c.id === (fallbackCategory as any).id) as any;
        }
        // Persist new item immutably
        {
          const updatedRestaurant = {
            ...((getRestaurantsStore() as any[]).find((r: any) => r.id === restaurant.id) || restaurant),
            categories: (restaurant.categories || []).map((c: any) =>
              c.id === category.id
                ? { ...c, menuItems: [...(c.menuItems || []), newItem] }
                : c
            )
          };
          const next = (getRestaurantsStore() as any[]).map((r: any) => (r.id === restaurant.id ? updatedRestaurant : r));
          setRestaurantsStore(next);
        }
        if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
          (window as any).dispatchEvent(new CustomEvent('menuUpdated', { detail: { restaurantId: restaurant.id } }));
        }
        resolve(newItem);
      }, 300);
    });
  },

  // Update menu item
  updateMenuItem: async (id: string, updates: Partial<MenuItem>): Promise<MenuItem> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let foundItem: MenuItem | null = null;
        let foundRestaurantId: string | null = null;
        let originalCategory: any = null;
        const restaurants = getRestaurantsStore() as any[];
        let next = restaurants;
        restaurants.forEach((r, ri) => {
          (r.categories || []).forEach((c: any, ci: number) => {
            const idx = (c.menuItems || []).findIndex((mi: any) => mi.id === id);
            if (idx !== -1) {
              // If categoryId changes, move the item between categories
              if (updates.categoryId && updates.categoryId !== c.menuItems[idx].categoryId) {
                const itemToMove = { ...c.menuItems[idx], ...updates };
                // Remove from current category
                next = next.map((r2, r2i) => r2i !== ri ? r2 : {
                  ...r2,
                  categories: r2.categories.map((cat: any, catIdx: number) =>
                    catIdx !== ci ? cat : { ...cat, menuItems: cat.menuItems.filter((_: any, i: number) => i !== idx) }
                  )
                });
                // Find or create target category
                const targetRestaurant = (next as any[])[ri];
                let targetCategory = (targetRestaurant.categories || []).find((cat: any) => cat.id === updates.categoryId);
                if (!targetCategory) {
                  const incomingCategory: any = (updates as any).category;
                  const newCategory: Category = {
                    id: updates.categoryId,
                    restaurantId: targetRestaurant.id,
                    name: incomingCategory?.name || 'Other',
                    nameAr: incomingCategory?.nameAr || 'أخرى',
                    description: incomingCategory?.description || 'Miscellaneous items',
                    image: incomingCategory?.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300',
                    sortOrder: incomingCategory?.sortOrder || 99,
                    isActive: true,
                    menuItems: []
                  };
                  const updatedR = {
                    ...targetRestaurant,
                    categories: targetRestaurant.categories ? [...targetRestaurant.categories, newCategory] : [newCategory]
                  };
                  next = next.map((r2, r2i) => (r2i === ri ? updatedR : r2));
                  targetCategory = (updatedR.categories as any[]).find((cat: any) => cat.id === newCategory.id) as any;
                }
                itemToMove.categoryId = updates.categoryId;
                const updatedR2 = {
                  ...((next as any[])[ri]),
                  categories: ((next as any[])[ri].categories || []).map((cat: any) =>
                    cat.id === targetCategory.id ? { ...cat, menuItems: [...(cat.menuItems || []), itemToMove] } : cat
                  )
                };
                next = next.map((r2, r2i) => (r2i === ri ? updatedR2 : r2));
                foundItem = itemToMove;
              } else {
                const updatedCategory = { ...c, menuItems: c.menuItems.map((mi: any, i: number) => i === idx ? { ...mi, ...updates } : mi) };
                const updatedRestaurant = { ...r, categories: r.categories.map((cat: any, i: number) => i === ci ? updatedCategory : cat) };
                next = next.map((r2) => (r2.id === updatedRestaurant.id ? updatedRestaurant : r2));
                foundItem = (updatedCategory.menuItems as any[])[idx];
              }
              originalCategory = c;
              foundRestaurantId = r.id;
            }
          });
        });
        if (!foundItem) {
          reject(new Error('Menu item not found'));
          return;
        }
        setRestaurantsStore(next);
        if (typeof window !== 'undefined' && (window as any).dispatchEvent && foundRestaurantId) {
          (window as any).dispatchEvent(new CustomEvent('menuUpdated', { detail: { restaurantId: foundRestaurantId } }));
        }
        resolve(foundItem as MenuItem);
      }, 300);
    });
  },

  // Delete a menu item
  deleteMenuItem: async (id: string): Promise<{ success: boolean }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let removed = false;
        let affectedRestaurantId: string | null = null;
        const restaurants = getRestaurantsStore() as any[];
        let next = restaurants;
        restaurants.forEach((r, ri) => {
          (r.categories || []).forEach((c: any, ci: number) => {
            const before = (c.menuItems || []).length;
            const filtered = (c.menuItems || []).filter((mi: any) => mi.id !== id);
            if (filtered.length !== before) {
              removed = true;
              affectedRestaurantId = r.id;
              const updatedCategory = { ...c, menuItems: filtered };
              const updatedRestaurant = { ...r, categories: r.categories.map((cat: any, i: number) => i === ci ? updatedCategory : cat) };
              next = next.map((r2) => (r2.id === updatedRestaurant.id ? updatedRestaurant : r2));
            }
          });
        });
        if (!removed) {
          reject(new Error('Menu item not found'));
          return;
        }
        setRestaurantsStore(next);
        if (typeof window !== 'undefined' && (window as any).dispatchEvent && affectedRestaurantId) {
          (window as any).dispatchEvent(new CustomEvent('menuUpdated', { detail: { restaurantId: affectedRestaurantId } }));
        }
        resolve({ success: true });
      }, 300);
    });
  },

  // Get restaurant analytics
  getAnalytics: async (restaurantId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalOrders: 156,
          totalRevenue: 15680,
          averageOrderValue: 100.5,
          topItems: [
            { name: 'Margherita Pizza', orders: 45, revenue: 2025 },
            { name: 'Chicken Burger', orders: 32, revenue: 1120 }
          ],
          dailyStats: [
            { date: '2024-01-01', orders: 12, revenue: 1200 },
            { date: '2024-01-02', orders: 15, revenue: 1500 },
            { date: '2024-01-03', orders: 18, revenue: 1800 }
          ]
        });
      }, 500);
    });
  },

  // Update restaurant settings
  updateRestaurantSettings: async (restaurantId: string, settings: Partial<Restaurant>): Promise<Restaurant> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const restaurants = getRestaurantsStore() as any[];
        const index = restaurants.findIndex(r => r.id === restaurantId);
        if (index === -1) {
          reject(new Error('Restaurant not found'));
          return;
        }
        const updated = { ...restaurants[index], ...settings };
        const next = restaurants.map((r, i) => (i === index ? updated : r));
        setRestaurantsStore(next);
        if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
          (window as any).dispatchEvent(new CustomEvent('menuUpdated', { detail: { restaurantId } }));
        }
        resolve(updated as any);
      }, 300);
    });
  }
};

// Delivery Driver Functions
export const deliveryDriverService = {
  // Get available deliveries
  getAvailableDeliveries: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            customer: 'Ahmed Ali',
            restaurant: 'Pizza Palace',
            address: '123 Main St, Downtown',
            distance: '2.5 km',
            estimatedTime: '15 min',
            payment: 25,
            status: 'ready_for_pickup',
            items: ['Margherita Pizza', 'Chicken Burger'],
            total: 80,
            phone: '+20123456789'
          },
          {
            id: '2',
            customer: 'Sara Mohamed',
            restaurant: 'Burger King',
            address: '456 Oak Ave, Uptown',
            distance: '3.2 km',
            estimatedTime: '20 min',
            payment: 30,
            status: 'ready_for_pickup',
            items: ['Chicken Burger', 'Fries'],
            total: 65,
            phone: '+20123456790'
          }
        ]);
      }, 500);
    });
  },

  // Accept delivery
  acceptDelivery: async (deliveryId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Delivery ${deliveryId} accepted`);
        resolve();
      }, 500);
    });
  },

  // Update delivery status
  updateDeliveryStatus: async (deliveryId: string, status: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Delivery ${deliveryId} status updated to ${status}`);
        resolve();
      }, 500);
    });
  },

  // Get driver earnings
  getEarnings: async (driverId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalEarnings: 2340,
          todayEarnings: 150,
          weeklyEarnings: 450,
          monthlyEarnings: 1800,
          completedDeliveries: 87,
          averageRating: 4.8,
          earningsHistory: [
            { date: '2024-01-01', earnings: 120 },
            { date: '2024-01-02', earnings: 150 },
            { date: '2024-01-03', earnings: 180 }
          ]
        });
      }, 500);
    });
  }
};

// Admin Functions
export const adminService = {
  // Get system statistics
  getSystemStats: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalUsers: 1256,
          totalRestaurants: 89,
          totalOrders: 4567,
          totalRevenue: 125680,
          activeDrivers: 45,
          pendingApprovals: 12,
          todayOrders: 156,
          todayRevenue: 4560
        });
      }, 500);
    });
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            type: 'restaurant',
            name: 'New Pizza Place',
            owner: 'Ahmed Hassan',
            submittedAt: '2024-01-15T10:30:00Z',
            status: 'pending'
          },
          {
            id: '2',
            type: 'driver',
            name: 'Mohamed Ali',
            phone: '+20123456789',
            submittedAt: '2024-01-15T11:00:00Z',
            status: 'pending'
          }
        ]);
      }, 500);
    });
  },

  // Approve request
  approveRequest: async (requestId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Request ${requestId} approved`);
        resolve();
      }, 500);
    });
  },

  // Reject request
  rejectRequest: async (requestId: string, reason: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Request ${requestId} rejected: ${reason}`);
        resolve();
      }, 500);
    });
  },

  // Get user management data
  getUsers: async (page: number = 1, limit: number = 20) => {
    if (MOCK_ENABLED) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const all = getUsersPublic();
          resolve({ users: all, total: all.length, page, limit });
        }, 500);
      });
    }
    return apiClient.get(`/admin/users?page=${page}&limit=${limit}`);
  },

  // Get restaurant management data
  getRestaurants: async (page: number = 1, limit: number = 20) => {
    if (MOCK_ENABLED) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const all = getRestaurantsStore() as any[];
          resolve({ restaurants: all as any, total: all.length, page, limit });
        }, 500);
      });
    }
    return apiClient.get(`/admin/restaurants?page=${page}&limit=${limit}`);
  },

  // Create user with credentials and role
  createUser: async (input: { email: string; password: string; firstName: string; lastName: string; phone?: string; role: UserRole }): Promise<User> => {
    if (MOCK_ENABLED) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const created: any = addUser(input as any);
            const { password, ...publicUser } = created;
            resolve(publicUser as User);
          } catch (e) {
            reject(e);
          }
        }, 300);
      });
    }
    return apiClient.post('/admin/users', input).then(response => response.data);
  },

  // Update user details (admin)
  updateUser: async (
    userId: string,
    updates: Partial<User & { password?: string }>
  ): Promise<User> => {
    if (MOCK_ENABLED) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const updated: any = updateUser(userId, updates as any);
            const { password, ...publicUser } = updated;
            resolve(publicUser as User);
          } catch (e) {
            reject(e);
          }
        }, 300);
      });
    }
    return apiClient.put(`/admin/users/${userId}`, updates).then(response => response.data);
  },

  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    if (MOCK_ENABLED) {
      return new Promise((resolve) => {
        setTimeout(() => {
          deleteUser(userId as any);
          resolve({ success: true });
        }, 300);
      });
    }
    return apiClient.delete(`/admin/users/${userId}`);
  },

  setUserRole: async (userId: string, role: UserRole): Promise<User> => {
    if (MOCK_ENABLED) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const updated: any = updateUser(userId, { role } as any);
            const { password, ...publicUser } = updated;
            resolve(publicUser as User);
          } catch (e) {
            reject(e);
          }
        }, 300);
      });
    }
    return apiClient.put(`/admin/users/${userId}/role`, { role }).then(response => response.data);
  },

  // Restaurants CRUD
  createRestaurant: async (restaurant: Omit<Restaurant, 'id' | 'totalReviews'> & { totalReviews?: number }): Promise<Restaurant> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const next: any[] = (getRestaurantsStore() as any[]).slice();
        const generatedId = Date.now().toString();
        // Seed default categories for new restaurants so Owner can add menu immediately
        const defaultCategories: any[] = (restaurant as any).categories && (restaurant as any).categories.length > 0
          ? (restaurant as any).categories
          : [
              {
                id: `cat-main-${generatedId}`,
                restaurantId: generatedId,
                name: 'Main Dishes',
                nameAr: 'الأطباق الرئيسية',
                description: 'Main course dishes',
                image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300',
                sortOrder: 1,
                isActive: true,
                menuItems: []
              },
              {
                id: `cat-dessert-${generatedId}`,
                restaurantId: generatedId,
                name: 'Desserts',
                nameAr: 'الحلويات',
                description: 'Sweet treats',
                image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300',
                sortOrder: 2,
                isActive: true,
                menuItems: []
              },
              {
                id: `cat-drinks-${generatedId}`,
                restaurantId: generatedId,
                name: 'Beverages',
                nameAr: 'المشروبات',
                description: 'Hot and cold drinks',
                image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300',
                sortOrder: 3,
                isActive: true,
                menuItems: []
              }
            ];

        const newRestaurant: any = {
          ...restaurant,
          id: generatedId,
          totalReviews: restaurant.totalReviews ?? 0,
          categories: defaultCategories
        };
        next.push(newRestaurant);
        setRestaurantsStore(next);
        resolve(newRestaurant);
      }, 300);
    });
  },

  updateRestaurant: async (restaurantId: string, updates: Partial<Restaurant>): Promise<Restaurant> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const all = getRestaurantsStore() as any[];
        const idx = all.findIndex(r => r.id === restaurantId);
        if (idx === -1) {
          reject(new Error('Restaurant not found'));
          return;
        }
        const updated = { ...all[idx], ...updates };
        const next = all.map((r, i) => (i === idx ? updated : r));
        setRestaurantsStore(next);
        resolve(updated as any);
      }, 300);
    });
  },

  deleteRestaurant: async (restaurantId: string): Promise<{ success: boolean }> => {
    if (MOCK_ENABLED) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const next = (getRestaurantsStore() as any[]).filter(r => r.id !== restaurantId);
          setRestaurantsStore(next);
          resolve({ success: true });
        }, 300);
      });
    }
    return apiClient.delete(`/admin/restaurants/${restaurantId}`);
  },

  // Get analytics
  getAnalytics: async () => {
    if (MOCK_ENABLED) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            revenueChart: [
              { date: '2024-01-01', revenue: 1200 },
              { date: '2024-01-02', revenue: 1500 },
              { date: '2024-01-03', revenue: 1800 }
            ],
            ordersChart: [
              { date: '2024-01-01', orders: 12 },
              { date: '2024-01-02', orders: 15 },
              { date: '2024-01-03', orders: 18 }
            ],
            topRestaurants: [
              { name: 'Pizza Palace', orders: 156, revenue: 4560 },
              { name: 'Burger King', orders: 134, revenue: 3890 },
              { name: 'KFC', orders: 98, revenue: 2340 }
            ]
          });
        }, 500);
      });
    }
    return apiClient.get('/admin/analytics');
  }
};

// Customer Functions
export const customerService = {
  // Get customer statistics
  getCustomerStats: async (customerId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalOrders: 25,
          totalSpent: 1250,
          favoriteRestaurants: ['Pizza Palace', 'Burger King'],
          averageOrderValue: 50,
          lastOrderDate: '2024-01-15T14:30:00Z'
        });
      }, 500);
    });
  },

  // Get favorite restaurants
  getFavoriteRestaurants: async (customerId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Pizza Palace',
            rating: 4.5,
            lastOrderDate: '2024-01-15T14:30:00Z',
            totalOrders: 8
          },
          {
            id: '2',
            name: 'Burger King',
            rating: 4.3,
            lastOrderDate: '2024-01-14T12:15:00Z',
            totalOrders: 5
          }
        ]);
      }, 500);
    });
  },

  // Add to favorites
  addToFavorites: async (customerId: string, restaurantId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Restaurant ${restaurantId} added to favorites for customer ${customerId}`);
        resolve();
      }, 500);
    });
  },

  // Remove from favorites
  removeFromFavorites: async (customerId: string, restaurantId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Restaurant ${restaurantId} removed from favorites for customer ${customerId}`);
        resolve();
      }, 500);
    });
  }
};


