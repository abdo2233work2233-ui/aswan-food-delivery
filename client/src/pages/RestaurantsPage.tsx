import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchRestaurants,
  searchRestaurantsAndItems,
  setFilters,
  resetFilters,
  clearSearchResults,
  selectRestaurants,
  selectRestaurantLoading,
  selectRestaurantFilters,
  selectRestaurantPagination,
  selectSearchResults,
} from '../store/slices/restaurantSlice';
import { selectLanguage } from '../store/slices/uiSlice';
import RestaurantCard from '../components/ui/RestaurantCard';
import ProfessionalSearchBar from '../components/ui/ProfessionalSearchBar';
import { completeMenuItems } from '../data/completeMenuItems';
import { SearchResult } from '../utils/searchUtils';
import {
  FiSearch,
  FiFilter,
  FiX,
  FiStar,
  FiClock,
  FiTruck,
  FiGrid,
  FiList,
} from 'react-icons/fi';

const RestaurantsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const restaurants = useAppSelector(selectRestaurants);
  const isLoading = useAppSelector(selectRestaurantLoading);
  const filters = useAppSelector(selectRestaurantFilters);
  const pagination = useAppSelector(selectRestaurantPagination);
  const searchResults = useAppSelector(selectSearchResults);
  const language = useAppSelector(selectLanguage);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isArabic = language === 'ar';

  // Initialize search from URL params
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const rating = searchParams.get('rating');
    const deliveryTime = searchParams.get('deliveryTime');
    const minCalories = searchParams.get('minCalories');
    const maxCalories = searchParams.get('maxCalories');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');

    if (search || category || rating || deliveryTime || minCalories || maxCalories || sortBy || sortOrder) {
      dispatch(setFilters({
        search: search || undefined,
        category: category || undefined,
        minRating: rating ? Number(rating) : undefined,
        maxDeliveryTime: deliveryTime ? Number(deliveryTime) : undefined,
        minCalories: minCalories ? Number(minCalories) : undefined,
        maxCalories: maxCalories ? Number(maxCalories) : undefined,
        sortBy: (sortBy as any) || 'rating',
        sortOrder: (sortOrder as any) || 'desc',
      }));
    }

    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams, dispatch]);

  // Fetch restaurants when filters change
  useEffect(() => {
    dispatch(fetchRestaurants(filters));
  }, [dispatch, filters]);

  // Professional search handlers
  const handleProfessionalSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      dispatch(searchRestaurantsAndItems({ query, page: 1, limit: 20 }));
    } else {
      dispatch(clearSearchResults());
      dispatch(setFilters({ ...filters, search: undefined, page: 1 }));
      updateURLParams({ ...filters, search: undefined, page: 1 });
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setSearchQuery(suggestion.name);
    dispatch(searchRestaurantsAndItems({ query: suggestion.name, page: 1, limit: 20 }));
  };

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    dispatch(setFilters(updatedFilters));
    updateURLParams(updatedFilters);
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    dispatch(clearSearchResults());
    setSearchQuery('');
    setSearchParams({});
  };

  const updateURLParams = (newFilters: any) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    dispatch(setFilters(newFilters));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-neutral-800">
                {isArabic ? 'المطاعم' : 'Restaurants'}
              </h1>
              <p className="text-neutral-600 mt-1">
                {isArabic 
                  ? 'اكتشف أفضل المطاعم في أسوان'
                  : 'Discover the best restaurants in Aswan'
                }
              </p>
            </div>

            {/* Professional Search Bar */}
            <div className="flex-1 max-w-lg">
              <ProfessionalSearchBar
                restaurants={restaurants}
                menuItems={completeMenuItems}
                onSearch={handleProfessionalSearch}
                onSuggestionClick={handleSuggestionClick}
                placeholder={isArabic ? 'ابحث عن المطاعم والطعام...' : 'Search restaurants & food...'}
                isArabic={isArabic}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-800">
                  {isArabic ? 'الفلاتر' : 'Filters'}
                </h3>
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {isArabic ? 'إعادة تعيين' : 'Reset'}
                </button>
              </div>

              <div className="space-y-6">
                {/* Cuisine Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    {isArabic ? 'نوع المطبخ' : 'Cuisine Type'}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'Egyptian', label: isArabic ? 'مصري' : 'Egyptian' },
                      { value: 'International', label: isArabic ? 'دولي' : 'International' },
                      { value: 'Middle Eastern', label: isArabic ? 'شرق أوسطي' : 'Middle Eastern' },
                      { value: 'Italian', label: isArabic ? 'إيطالي' : 'Italian' },
                      { value: 'Seafood', label: isArabic ? 'مأكولات بحرية' : 'Seafood' },
                      { value: 'Fast Food', label: isArabic ? 'وجبات سريعة' : 'Fast Food' },
                      { value: 'Vegetarian', label: isArabic ? 'نباتي' : 'Vegetarian' },
                      { value: 'Desserts', label: isArabic ? 'حلويات' : 'Desserts' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="cuisine"
                          checked={filters.category === option.value}
                          onChange={() => handleFilterChange({ category: option.value })}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 ml-3 rtl:ml-0 rtl:mr-3">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    {isArabic ? 'التقييم' : 'Rating'}
                  </label>
                  <div className="space-y-2">
                    {/* Clear Rating Filter */}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        checked={!filters.minRating}
                        onChange={() => handleFilterChange({ minRating: undefined })}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-600 ml-3 rtl:ml-0 rtl:mr-3">
                        {isArabic ? 'جميع التقييمات' : 'All Ratings'}
                      </span>
                    </label>
                    
                    {[4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.minRating === rating}
                          onChange={() => handleFilterChange({ minRating: rating })}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex items-center ml-3 rtl:ml-0 rtl:mr-3">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-neutral-600 ml-2 rtl:ml-0 rtl:mr-2">
                            {rating}+ {isArabic ? 'نجوم' : 'stars'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    {isArabic ? 'نطاق السعر' : 'Price Range'}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: '$', label: isArabic ? 'اقتصادي' : 'Budget ($)' },
                      { value: '$$', label: isArabic ? 'متوسط' : 'Moderate ($$)' },
                      { value: '$$$', label: isArabic ? 'مكلف' : 'Expensive ($$$)' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange === option.value}
                          onChange={() => handleFilterChange({ priceRange: option.value })}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 ml-3 rtl:ml-0 rtl:mr-3">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Calorie Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    {isArabic ? 'السعرات الحرارية' : 'Calories'}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: { min: 0, max: 300 }, label: isArabic ? 'منخفضة (0-300)' : 'Low (0-300)' },
                      { value: { min: 300, max: 500 }, label: isArabic ? 'متوسطة (300-500)' : 'Medium (300-500)' },
                      { value: { min: 500, max: 700 }, label: isArabic ? 'عالية (500-700)' : 'High (500-700)' },
                      { value: { min: 700, max: 1000 }, label: isArabic ? 'عالية جداً (700+)' : 'Very High (700+)' },
                    ].map((option, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="radio"
                          name="calorieRange"
                          checked={filters.minCalories === option.value.min && filters.maxCalories === option.value.max}
                          onChange={() => handleFilterChange({ 
                            minCalories: option.value.min, 
                            maxCalories: option.value.max 
                          })}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 ml-3 rtl:ml-0 rtl:mr-3">
                          {option.label}
                        </span>
                      </label>
                    ))}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="calorieRange"
                        checked={!filters.minCalories && !filters.maxCalories}
                        onChange={() => handleFilterChange({ 
                          minCalories: undefined, 
                          maxCalories: undefined 
                        })}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-600 ml-3 rtl:ml-0 rtl:mr-3">
                        {isArabic ? 'جميع السعرات' : 'All Calories'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Delivery Time Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    {isArabic ? 'وقت التوصيل' : 'Delivery Time'}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 30, label: isArabic ? '30 دقيقة أو أقل' : '30 min or less' },
                      { value: 45, label: isArabic ? '45 دقيقة أو أقل' : '45 min or less' },
                      { value: 60, label: isArabic ? '60 دقيقة أو أقل' : '60 min or less' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="deliveryTime"
                          checked={filters.maxDeliveryTime === option.value}
                          onChange={() => handleFilterChange({ maxDeliveryTime: option.value })}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 ml-3 rtl:ml-0 rtl:mr-3">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    {isArabic ? 'ترتيب حسب' : 'Sort By'}
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange({ sortBy, sortOrder });
                    }}
                    className="input w-full"
                  >
                    <option value="rating-desc">
                      {isArabic ? 'الأعلى تقييماً' : 'Highest Rated'}
                    </option>
                    <option value="deliveryTime-asc">
                      {isArabic ? 'الأسرع توصيلاً' : 'Fastest Delivery'}
                    </option>
                    <option value="deliveryFee-asc">
                      {isArabic ? 'الأقل في رسوم التوصيل' : 'Lowest Delivery Fee'}
                    </option>
                    <option value="name-asc">
                      {isArabic ? 'الاسم (أ-ي)' : 'Name (A-Z)'}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden btn btn-outline btn-sm flex items-center space-x-2 rtl:space-x-reverse"
                >
                  <FiFilter className="h-4 w-4" />
                  <span>{isArabic ? 'الفلاتر' : 'Filters'}</span>
                </button>

                {pagination && (
                  <p className="text-sm text-neutral-600">
                    {isArabic 
                      ? `عرض ${restaurants.length} من ${pagination.total} مطعم`
                      : `Showing ${restaurants.length} of ${pagination.total} restaurants`
                    }
                  </p>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  <FiGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  <FiList className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.search || filters.minRating || filters.maxDeliveryTime) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-neutral-600">
                  {isArabic ? 'الفلاتر النشطة:' : 'Active filters:'}
                </span>
                
                {filters.search && (
                  <span className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                    <span>"{filters.search}"</span>
                    <button
                      onClick={() => handleFilterChange({ search: undefined })}
                      className="hover:text-primary-900"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filters.minRating && (
                  <span className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    <span>{filters.minRating}+ {isArabic ? 'نجوم' : 'stars'}</span>
                    <button
                      onClick={() => handleFilterChange({ minRating: undefined })}
                      className="hover:text-yellow-900"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filters.maxDeliveryTime && (
                  <span className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <span>≤{filters.maxDeliveryTime} {isArabic ? 'د' : 'min'}</span>
                    <button
                      onClick={() => handleFilterChange({ maxDeliveryTime: undefined })}
                      className="hover:text-green-900"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Restaurants Grid/List */}
            {isLoading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-48 bg-neutral-200 rounded-t-xl"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
                      <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                      <div className="flex space-x-4 rtl:space-x-reverse">
                        <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                        <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : restaurants.length > 0 ? (
              <>
                {/* Search Results */}
                {searchResults && searchQuery && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                      {isArabic ? 'نتائج البحث' : 'Search Results'}
                    </h2>
                    
                    {/* Food Items Results */}
                    {searchResults.menuItems && searchResults.menuItems.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-neutral-700 mb-3">
                          {isArabic ? 'الأطعمة' : 'Food Items'}
                        </h3>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {searchResults.menuItems.map((item: any) => (
                            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/64x64?text=' + item.name.charAt(0);
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-neutral-800 truncate">
                                    {isArabic ? item.nameAr : item.name}
                                  </h4>
                                  <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                    {isArabic ? item.descriptionAr : item.description}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-primary-600 font-semibold">
                                      {item.price} EGP
                                    </span>
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                      {item.calories && (
                                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                                          {item.calories} cal
                                        </span>
                                      )}
                                      <span className="text-xs text-neutral-500">
                                        Restaurant {item.restaurantId}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Restaurants Results */}
                    {searchResults.restaurants && searchResults.restaurants.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-neutral-700 mb-3">
                          {isArabic ? 'المطاعم' : 'Restaurants'}
                        </h3>
                        <div className={`grid gap-6 ${
                          viewMode === 'grid' 
                            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                            : 'grid-cols-1'
                        }`}>
                          {searchResults.restaurants.map((restaurant: any, index: number) => (
                            <RestaurantCard
                              key={restaurant.id}
                              restaurant={restaurant}
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No Results */}
                    {(!searchResults.menuItems || searchResults.menuItems.length === 0) && 
                     (!searchResults.restaurants || searchResults.restaurants.length === 0) && (
                      <div className="text-center py-8">
                        <p className="text-neutral-500">
                          {isArabic ? 'لم يتم العثور على نتائج' : 'No results found'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Regular Restaurants Grid */}
                {!searchResults && (
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                  {restaurants.map((restaurant, index) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      index={index}
                    />
                  ))}
                </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center mt-12 space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isArabic ? 'السابق' : 'Previous'}
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= pagination.page - 2 && page <= pagination.page + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`btn btn-sm ${
                              page === pagination.page
                                ? 'btn-primary'
                                : 'btn-outline'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === pagination.page - 3 ||
                        page === pagination.page + 3
                      ) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isArabic ? 'التالي' : 'Next'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="h-12 w-12 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  {isArabic ? 'لا توجد مطاعم' : 'No restaurants found'}
                </h3>
                <p className="text-neutral-500 mb-6">
                  {isArabic 
                    ? 'جرب تغيير الفلاتر أو البحث عن شيء آخر'
                    : 'Try changing your filters or search for something else'
                  }
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn btn-primary"
                >
                  {isArabic ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantsPage;