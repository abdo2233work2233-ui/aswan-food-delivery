import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiX, FiClock, FiGrid, FiStar } from 'react-icons/fi';
import { 
  performProfessionalSearch, 
  SearchResult, 
  SearchHistory, 
  trackSearch,
  DEFAULT_SEARCH_CONFIG 
} from '../../utils/searchUtils';

interface ProfessionalSearchBarProps {
  restaurants: any[];
  menuItems: any[];
  onSearch: (query: string) => void;
  onSuggestionClick: (suggestion: SearchResult) => void;
  placeholder?: string;
  className?: string;
  isArabic?: boolean;
}

const ProfessionalSearchBar: React.FC<ProfessionalSearchBarProps> = ({
  restaurants,
  menuItems,
  onSearch,
  onSuggestionClick,
  placeholder = 'Search restaurants & food...',
  className = '',
  isArabic = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(SearchHistory.getHistory());
  }, []);

  // Debounced search function
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.length < DEFAULT_SEARCH_CONFIG.minQueryLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      const results = performProfessionalSearch(
        searchQuery,
        restaurants,
        menuItems,
        DEFAULT_SEARCH_CONFIG
      );
      
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsLoading(false);
      
      // Track search analytics
      trackSearch(searchQuery, results.length);
    }, DEFAULT_SEARCH_CONFIG.debounceMs);
  }, [restaurants, menuItems]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      performSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Add to search history
    SearchHistory.add(suggestion.name);
    setSearchHistory(SearchHistory.getHistory());
    
    // Call parent handler
    onSuggestionClick(suggestion);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      SearchHistory.add(query);
      setSearchHistory(SearchHistory.getHistory());
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle history item click
  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    setShowSuggestions(false);
    onSearch(historyItem);
  };

  // Clear search history
  const handleClearHistory = () => {
    SearchHistory.clear();
    setSearchHistory([]);
  };

  // Focus management
  const handleFocus = () => {
    if (query.length >= DEFAULT_SEARCH_CONFIG.minQueryLength) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <FiSearch className="absolute top-3 left-3 rtl:left-auto rtl:right-3 h-5 w-5 text-neutral-400" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isArabic ? 'ابحث عن المطاعم والطعام...' : placeholder}
            className="input w-full pl-10 rtl:pl-3 rtl:pr-10 pr-10"
            autoComplete="off"
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
            </div>
          )}
          
          {/* Clear button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-3 right-3 rtl:right-auto rtl:left-3 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Professional Suggestions Dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
        >
          {/* Search Results */}
          {suggestions.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`p-3 cursor-pointer border-b border-neutral-100 last:border-b-0 transition-colors ${
                    selectedIndex === index 
                      ? 'bg-primary-50 border-primary-200' 
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <img 
                        src={suggestion.image} 
                        alt={suggestion.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/48x48?text=${suggestion.name.charAt(0)}`;
                        }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="text-sm font-semibold text-neutral-800 truncate">
                            {isArabic ? suggestion.nameAr : suggestion.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.type === 'food' 
                              ? 'bg-primary-100 text-primary-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {suggestion.type === 'food' 
                              ? (isArabic ? 'طعام' : 'Food')
                              : (isArabic ? 'مطعم' : 'Restaurant')
                            }
                          </span>
                        </div>
                        
                      </div>
                      
                      {/* Description */}
                      {suggestion.description && (
                        <p className="text-xs text-neutral-500 truncate mt-1">
                          {suggestion.description}
                        </p>
                      )}
                      
                      {/* Additional Info */}
                      <div className="flex items-center space-x-3 rtl:space-x-reverse mt-1">
                        {suggestion.type === 'food' && suggestion.price && (
                          <span className="text-xs font-medium text-green-600">
                            {suggestion.price} EGP
                          </span>
                        )}
                        
                        {suggestion.type === 'restaurant' && suggestion.rating && (
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <FiStar className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-neutral-600">
                              {suggestion.rating}
                            </span>
                          </div>
                        )}
                        
                        {suggestion.type === 'restaurant' && suggestion.deliveryTime && (
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <FiClock className="h-3 w-3 text-neutral-400" />
                            <span className="text-xs text-neutral-600">
                              {suggestion.deliveryTime} min
                            </span>
                          </div>
                        )}
                        
                        {suggestion.cuisine && (
                          <span className="text-xs text-neutral-500">
                            {suggestion.cuisine}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Search History */}
          {suggestions.length === 0 && searchHistory.length > 0 && (
            <div className="p-3 border-b border-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <FiClock className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-600">
                    {isArabic ? 'البحث السابق' : 'Recent Searches'}
                  </span>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  {isArabic ? 'مسح' : 'Clear'}
                </button>
              </div>
              
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(historyItem)}
                    className="w-full text-left px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-50 rounded transition-colors"
                  >
                    {historyItem}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Popular Searches */}
          {suggestions.length === 0 && searchHistory.length === 0 && (
            <div className="p-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <FiGrid className="h-4 w-4 text-neutral-400" />
                <span className="text-sm font-medium text-neutral-600">
                  {isArabic ? 'البحث الشائع' : 'Popular Searches'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['Pizza', 'Koshari', 'Burger', 'Pasta', 'Chicken'].map((popular, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(popular)}
                    className="px-3 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    {popular}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* No Results */}
          {suggestions.length === 0 && query.length >= DEFAULT_SEARCH_CONFIG.minQueryLength && (
            <div className="p-4 text-center">
              <div className="text-neutral-400 mb-2">
                <FiSearch className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-neutral-600">
                {isArabic ? 'لم نجد نتائج لـ' : 'No results found for'} "{query}"
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {isArabic ? 'جرب كلمات مختلفة أو تحقق من الإملاء' : 'Try different keywords or check spelling'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalSearchBar;
