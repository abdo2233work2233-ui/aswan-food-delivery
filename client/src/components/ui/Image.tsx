import React, { useState, useRef, useEffect } from 'react';

interface ImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const Image: React.FC<ImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText,
  fallbackIcon,
  priority = false,
  sizes = '100vw',
  quality = 75
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Optimize image URL for WebP support
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return originalSrc;
    
    // Check if browser supports WebP
    const supportsWebP = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    // For external images, we can't optimize them
    if (originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, we could add WebP optimization here
    return originalSrc;
  };

  // Intersection Observer for lazy loading with better performance
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!src || hasError) {
    return (
      <div 
        className={`bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt}
      >
        {fallbackIcon || (
          <span className="text-primary-600 text-lg font-bold">
            {fallbackText || alt.charAt(0)}
          </span>
        )}
      </div>
    );
  }

  const optimizedSrc = getOptimizedSrc(src);

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? 'eager' : 'lazy'}
          sizes={sizes}
          decoding="async"
          // Performance optimizations
          style={{
            willChange: isLoading ? 'opacity' : 'auto',
            contain: 'layout style paint'
          }}
        />
      )}
    </div>
  );
};

export default Image;
