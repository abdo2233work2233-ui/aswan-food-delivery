import React from 'react';

// Professional Search Utilities
export interface SearchResult {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  type: 'restaurant' | 'food';
  image?: string;
  price?: number;
  rating?: number;
  cuisine?: string;
  deliveryTime?: number;
  score: number; // Relevance score
}

export interface SearchConfig {
  maxResults: number;
  minQueryLength: number;
  debounceMs: number;
  enableFuzzySearch: boolean;
  enableHistory: boolean;
}

// Default search configuration
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxResults: 8,
  minQueryLength: 2,
  debounceMs: 300,
  enableFuzzySearch: true,
  enableHistory: true
};

// Search history management
class SearchHistory {
  private static STORAGE_KEY = 'aswan_search_history';
  private static MAX_HISTORY = 10;

  static add(query: string): void {
    if (!query.trim()) return;
    
    const history = this.getHistory();
    const filteredHistory = history.filter(item => item !== query);
    const newHistory = [query, ...filteredHistory].slice(0, this.MAX_HISTORY);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newHistory));
  }

  static getHistory(): string[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Fuzzy search implementation
export const fuzzySearch = (query: string, text: string): number => {
  if (!query || !text) return 0;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return 100;
  
  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 90;
  
  // Contains query gets medium score
  if (textLower.includes(queryLower)) return 70;
  
  // Fuzzy matching for typos
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10;
      queryIndex++;
    }
  }
  
  // Calculate percentage of query matched
  const matchPercentage = (queryIndex / queryLower.length) * 50;
  return Math.max(score, matchPercentage);
};

// Advanced search scoring
export const calculateSearchScore = (
  item: any,
  query: string,
  type: 'restaurant' | 'food'
): number => {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  // Name matching (highest priority)
  const nameScore = fuzzySearch(queryLower, item.name || '');
  score += nameScore * 0.4;
  
  // Arabic name matching
  if (item.nameAr) {
    const nameArScore = fuzzySearch(queryLower, item.nameAr);
    score += nameArScore * 0.3;
  }
  
  // Description matching
  if (item.description) {
    const descScore = fuzzySearch(queryLower, item.description);
    score += descScore * 0.15;
  }
  
  // Cuisine matching (for restaurants)
  if (type === 'restaurant' && item.cuisine) {
    const cuisineScore = fuzzySearch(queryLower, item.cuisine);
    score += cuisineScore * 0.1;
  }
  
  // Ingredients matching (for food)
  if (type === 'food' && item.ingredients) {
    const ingredientsScore = fuzzySearch(queryLower, item.ingredients);
    score += ingredientsScore * 0.1;
  }
  
  // Boost popular items
  if (item.isPopular) {
    score += 5;
  }
  
  // Boost high-rated items
  if (item.rating && item.rating >= 4.5) {
    score += 3;
  }
  
  return Math.min(score, 100); // Cap at 100
};

// Professional search function
export const performProfessionalSearch = (
  query: string,
  restaurants: any[],
  menuItems: any[],
  config: SearchConfig = DEFAULT_SEARCH_CONFIG
): SearchResult[] => {
  if (!query || query.length < config.minQueryLength) {
    return [];
  }
  
  const results: SearchResult[] = [];
  
  // Search restaurants
  restaurants.forEach(restaurant => {
    const score = calculateSearchScore(restaurant, query, 'restaurant');
    if (score > 20) { // Minimum relevance threshold
      results.push({
        id: restaurant.id,
        name: restaurant.name,
        nameAr: restaurant.nameAr,
        description: restaurant.description,
        type: 'restaurant',
        image: restaurant.image,
        rating: restaurant.rating,
        cuisine: restaurant.cuisine,
        deliveryTime: restaurant.deliveryTime,
        score
      });
    }
  });
  
  // Search menu items
  menuItems.forEach(item => {
    const score = calculateSearchScore(item, query, 'food');
    if (score > 20) { // Minimum relevance threshold
      results.push({
        id: item.id,
        name: item.name,
        nameAr: item.nameAr,
        description: item.description,
        type: 'food',
        image: item.image,
        price: item.price,
        score
      });
    }
  });
  
  // Sort by relevance score and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, config.maxResults);
};

// Debounced search hook
export const useDebouncedSearch = (
  query: string,
  delay: number = DEFAULT_SEARCH_CONFIG.debounceMs
): string => {
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  return debouncedQuery;
};

// Search analytics
export const trackSearch = (query: string, resultCount: number): void => {
  // In a real app, you'd send this to analytics
  console.log(`Search: "${query}" returned ${resultCount} results`);
};

// Export search history utilities
export { SearchHistory };
