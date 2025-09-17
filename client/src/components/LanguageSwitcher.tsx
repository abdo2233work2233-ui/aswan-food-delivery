import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, getLanguageDirection } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
  showFlag?: boolean;
  showText?: boolean;
  variant?: 'dropdown' | 'toggle' | 'buttons';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  showFlag = true,
  showText = true,
  variant = 'dropdown'
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    
    // Update document direction
    const direction = getLanguageDirection(languageCode);
    document.documentElement.dir = direction;
    document.documentElement.lang = languageCode;
    
    // Store language preference
    localStorage.setItem('preferred-language', languageCode);
    
    setIsOpen(false);
  };

  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  const getFlagEmoji = (code: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'ar': '🇪🇬'
    };
    return flags[code] || '🌐';
  };

  if (variant === 'toggle') {
    return (
      <button
        onClick={() => handleLanguageChange(i18n.language === 'en' ? 'ar' : 'en')}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      >
        {showFlag && <span className="text-lg">{getFlagEmoji(currentLanguage.code)}</span>}
        {showText && <span>{currentLanguage.nativeName}</span>}
      </button>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`inline-flex rounded-md shadow-sm ${className}`}>
        {supportedLanguages.map((language, index) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`
              px-3 py-2 text-sm font-medium border
              ${i18n.language === language.code
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
              ${index === 0 ? 'rounded-l-md' : ''}
              ${index === supportedLanguages.length - 1 ? 'rounded-r-md' : ''}
              ${index > 0 ? 'border-l-0' : ''}
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          >
            {showFlag && <span className="mr-1 text-lg">{getFlagEmoji(language.code)}</span>}
            {showText && language.nativeName}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {showFlag && <span className="text-lg">{getFlagEmoji(currentLanguage.code)}</span>}
        {showText && <span>{currentLanguage.nativeName}</span>}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 z-50 w-48 mt-2 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {supportedLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`
                    flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-gray-100
                    ${i18n.language === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                  `}
                >
                  <span className="text-lg">{getFlagEmoji(language.code)}</span>
                  <div>
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-xs text-gray-500">{language.name}</div>
                  </div>
                  {i18n.language === language.code && (
                    <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;