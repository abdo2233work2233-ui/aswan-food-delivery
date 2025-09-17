import { apiClient } from './api';
import { 
  Restaurant, 
  MenuItem, 
  RestaurantFilters, 
  PaginatedResponse, 
  SearchResult, 
  ApiResponse 
} from '../types';
import { getRestaurantsStore } from '../data/runtimeData';

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

// Helper: flatten menu items from restaurant categories on demand (keeps data in sync)
const flattenMenuItems = (restaurants: Restaurant[]): MenuItem[] => {
  const items: MenuItem[] = [];
  restaurants.forEach((r: any) => {
    (r.categories || []).forEach((c: any) => {
      (c.menuItems || []).forEach((mi: any) => items.push(mi as MenuItem));
    });
  });
  return items;
};

// Enhanced filtering and search functions
const filterRestaurants = (restaurants: any[], filters: RestaurantFilters): any[] => {
  let filtered = [...restaurants];

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(restaurant => 
      restaurant.name.toLowerCase().includes(searchTerm) ||
      restaurant.nameAr?.toLowerCase().includes(searchTerm) ||
      restaurant.description.toLowerCase().includes(searchTerm) ||
      restaurant.descriptionAr?.toLowerCase().includes(searchTerm) ||
      restaurant.cuisine?.toLowerCase().includes(searchTerm) ||
      restaurant.address.toLowerCase().includes(searchTerm)
    );
  }

  // Rating filter
  if (filters.minRating) {
    filtered = filtered.filter(restaurant => restaurant.rating >= filters.minRating!);
  }

  // Delivery time filter
  if (filters.maxDeliveryTime) {
    filtered = filtered.filter(restaurant => restaurant.deliveryTime <= filters.maxDeliveryTime!);
  }

  // Cuisine filter
  if (filters.category) {
    filtered = filtered.filter(restaurant => restaurant.cuisine === filters.category);
  }

  // Price range filter (optional: only if property exists)
  if (filters.priceRange) {
    filtered = filtered.filter(restaurant => (restaurant as any).priceRange === filters.priceRange);
  }

  // Sort restaurants
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'deliveryTime':
          aValue = a.deliveryTime;
          bValue = b.deliveryTime;
          break;
        case 'deliveryFee':
          aValue = a.deliveryFee;
          bValue = b.deliveryFee;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          aValue = a.rating;
          bValue = b.rating;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  return filtered;
};


export const getRestaurants = async (filters: RestaurantFilters = {}): Promise<PaginatedResponse<Restaurant>> => {
  if (MOCK_ENABLED) {
    // Apply filters to shared mutable data
    const filteredRestaurants = filterRestaurants(getRestaurantsStore() as any[], filters);
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRestaurants = filteredRestaurants.slice(startIndex, endIndex);
    
    return {
      data: paginatedRestaurants as any,
      pagination: {
        page,
        limit,
        total: filteredRestaurants.length,
        totalPages: Math.ceil(filteredRestaurants.length / limit),
        hasNext: endIndex < filteredRestaurants.length,
        hasPrev: page > 1,
      },
      success: true,
      message: 'Restaurants fetched successfully'
    };
  }

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get<Restaurant[]>(`/restaurants?${params.toString()}`) as Promise<PaginatedResponse<Restaurant>>;
};

export const getRestaurantById = async (id: string): Promise<ApiResponse<Restaurant>> => {
  if (MOCK_ENABLED) {
    const restaurant = (getRestaurantsStore() as any[]).find(r => r.id === id);
    if (restaurant) {
      return { data: restaurant as any, success: true, message: 'Restaurant fetched successfully' };
    }
    throw new Error('Restaurant not found');
  }

  return apiClient.get<Restaurant>(`/restaurants/${id}`);
};

export const getRestaurantMenu = async (id: string): Promise<ApiResponse<{
  restaurant: Restaurant;
  categories: any[];
}>> => {
  if (MOCK_ENABLED) {
    const restaurant = (getRestaurantsStore() as any[]).find(r => r.id === id);
    if (restaurant) {
      const categories = (restaurant as any).categories || [];
      return {
        data: {
          restaurant: restaurant as any,
          categories
        },
        success: true,
        message: 'Restaurant menu fetched successfully'
      };
    }
    throw new Error('Restaurant not found');
  }

  return apiClient.get<{
    restaurant: Restaurant;
    categories: any[];
  }>(`/restaurants/${id}/menu`);
};

export const getRestaurantReviews = (
  id: string, 
  page: number = 1, 
  limit: number = 10
): Promise<PaginatedResponse<any>> => {
  return apiClient.get<any[]>(`/restaurants/${id}/reviews?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<any>>;
};

export const searchRestaurantsAndItems = async (
  query: string,
  page: number = 1,
  limit: number = 20,
  filters?: RestaurantFilters
): Promise<ApiResponse<SearchResult>> => {
  if (MOCK_ENABLED) {
    const searchResults = performSearch(query, filters);
    return Promise.resolve({
      data: searchResults,
      success: true,
      message: 'Search completed successfully'
    });
  }
  
  return apiClient.get<SearchResult>(`/restaurants/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`);
};

// Helper function to perform search
const performSearch = (query: string, filters?: RestaurantFilters): SearchResult => {
  const searchTerm = query.toLowerCase();
  
  const matchingRestaurants = (getRestaurantsStore() as any[]).filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm) ||
    restaurant.nameAr?.toLowerCase().includes(searchTerm) ||
    restaurant.description.toLowerCase().includes(searchTerm) ||
    restaurant.cuisine?.toLowerCase().includes(searchTerm)
  );

  let allItems = flattenMenuItems(getRestaurantsStore() as any);
  let matchingItems = allItems.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm) ||
    item.nameAr?.toLowerCase().includes(searchTerm) ||
    item.description?.toLowerCase().includes(searchTerm) ||
    item.ingredients?.toLowerCase().includes(searchTerm)
  );

  // Apply calorie filters to menu items
  if (filters?.minCalories !== undefined) {
    matchingItems = matchingItems.filter(item => 
      item.calories !== undefined && item.calories >= filters.minCalories!
    );
  }

  if (filters?.maxCalories !== undefined) {
    matchingItems = matchingItems.filter(item => 
      item.calories !== undefined && item.calories <= filters.maxCalories!
    );
  }

  return {
    restaurants: matchingRestaurants as any,
    menuItems: matchingItems as any,
    searchQuery: query
  };
};

export const getPopularItems = async (limit: number = 20): Promise<ApiResponse<MenuItem[]>> => {
  const apiAvailable = await isApiAvailable();
  
  if (!apiAvailable) {
    const popularItems = flattenMenuItems(getRestaurantsStore() as any)
      .filter((item: any) => item.isPopular)
      .slice(0, limit);
    
    return {
      data: popularItems as any,
      success: true,
      message: 'Popular items fetched successfully'
    };
  }
  
  return apiClient.get<MenuItem[]>(`/menu/popular?limit=${limit}`);
};

export const getMenuItemById = (id: string): Promise<ApiResponse<MenuItem>> => {
  return apiClient.get<MenuItem>(`/menu/items/${id}`);
};

export const searchMenuItems = (
  query: string,
  filters: {
    page?: number;
    limit?: number;
    restaurantId?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<ApiResponse<{
  items: MenuItem[];
  searchQuery: string;
  pagination: any;
}>> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get<{
    items: MenuItem[];
    searchQuery: string;
    pagination: any;
  }>(`/menu/search/${encodeURIComponent(query)}?${params.toString()}`);
};

export const getMenuCategories = (restaurantId?: string): Promise<ApiResponse<any[]>> => {
  const url = restaurantId 
    ? `/menu/categories?restaurantId=${restaurantId}`
    : '/menu/categories';
  
  return apiClient.get<any[]>(url);
};