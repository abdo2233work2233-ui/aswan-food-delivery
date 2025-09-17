import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

// Initialize i18n for backend
i18next
  .use(Backend)
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    backend: {
      loadPath: path.join(__dirname, 'locales', '{{lng}}.json'),
    },
    
    interpolation: {
      escapeValue: false, // Not needed for server-side
    },
  });

// Helper function to get translation based on Accept-Language header
export const getTranslation = (req: any) => {
  const acceptLanguage = req.headers['accept-language'] || 'en';
  const language = acceptLanguage.startsWith('ar') ? 'ar' : 'en';
  
  // Create a translator function for this language
  return (key: string, options?: any) => {
    return i18next.t(key, { lng: language, ...options });
  };
};

// Helper function to detect language from request
export const detectLanguage = (req: any): string => {
  // Check query parameter first
  if (req.query.lang && ['en', 'ar'].includes(req.query.lang)) {
    return req.query.lang;
  }
  
  // Check custom header
  if (req.headers['x-language'] && ['en', 'ar'].includes(req.headers['x-language'])) {
    return req.headers['x-language'];
  }
  
  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'] || 'en';
  return acceptLanguage.startsWith('ar') ? 'ar' : 'en';
};

// Middleware to add translation function to request
export const i18nMiddleware = (req: any, res: any, next: any) => {
  const language = detectLanguage(req);
  req.language = language;
  req.t = (key: string, options?: any) => {
    return i18next.t(key, { lng: language, ...options });
  };
  next();
};

export default i18next;