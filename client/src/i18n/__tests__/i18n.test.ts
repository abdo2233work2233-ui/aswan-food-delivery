import i18n from '../i18n';
import { resources } from '../i18n';
import { translations } from '../i18n';

describe('i18n Configuration', () => {
  it('should initialize with correct default language', () => {
    expect(i18n.language).toBe('ar');
  });

  it('should have Arabic and English resources', () => {
    expect(resources.ar).toBeDefined();
    expect(resources.en).toBeDefined();
  });

  it('should have correct fallback language', () => {
    expect(i18n.options.fallbackLng).toBe('ar');
  });

  it('should have correct interpolation settings', () => {
    expect(i18n.options.interpolation.escapeValue).toBe(false);
  });
});

describe('Arabic Translations', () => {
  it('should have common translations', () => {
    expect(translations.ar.common.home).toBe('الرئيسية');
    expect(translations.ar.common.about).toBe('حول');
    expect(translations.ar.common.contact).toBe('اتصل بنا');
    expect(translations.ar.common.login).toBe('تسجيل الدخول');
    expect(translations.ar.common.register).toBe('إنشاء حساب');
    expect(translations.ar.common.logout).toBe('تسجيل الخروج');
  });

  it('should have navigation translations', () => {
    expect(translations.ar.navigation.home).toBe('الرئيسية');
    expect(translations.ar.navigation.restaurants).toBe('المطاعم');
    expect(translations.ar.navigation.orders).toBe('الطلبات');
    expect(translations.ar.navigation.profile).toBe('الملف الشخصي');
  });

  it('should have restaurant translations', () => {
    expect(translations.ar.restaurant.name).toBe('اسم المطعم');
    expect(translations.ar.restaurant.description).toBe('الوصف');
    expect(translations.ar.restaurant.rating).toBe('التقييم');
    expect(translations.ar.restaurant.deliveryTime).toBe('وقت التوصيل');
    expect(translations.ar.restaurant.deliveryFee).toBe('رسوم التوصيل');
  });

  it('should have order translations', () => {
    expect(translations.ar.order.status).toBe('حالة الطلب');
    expect(translations.ar.order.total).toBe('المجموع');
    expect(translations.ar.order.items).toBe('العناصر');
    expect(translations.ar.order.deliveryAddress).toBe('عنوان التوصيل');
  });

  it('should have user translations', () => {
    expect(translations.ar.user.profile).toBe('الملف الشخصي');
    expect(translations.ar.user.settings).toBe('الإعدادات');
    expect(translations.ar.user.orders).toBe('طلباتي');
    expect(translations.ar.user.favorites).toBe('المفضلة');
  });
});

describe('English Translations', () => {
  it('should have common translations', () => {
    expect(translations.en.common.home).toBe('Home');
    expect(translations.en.common.about).toBe('About');
    expect(translations.en.common.contact).toBe('Contact');
    expect(translations.en.common.login).toBe('Login');
    expect(translations.en.common.register).toBe('Register');
    expect(translations.en.common.logout).toBe('Logout');
  });

  it('should have navigation translations', () => {
    expect(translations.en.navigation.home).toBe('Home');
    expect(translations.en.navigation.restaurants).toBe('Restaurants');
    expect(translations.en.navigation.orders).toBe('Orders');
    expect(translations.en.navigation.profile).toBe('Profile');
  });

  it('should have restaurant translations', () => {
    expect(translations.en.restaurant.name).toBe('Restaurant Name');
    expect(translations.en.restaurant.description).toBe('Description');
    expect(translations.en.restaurant.rating).toBe('Rating');
    expect(translations.en.restaurant.deliveryTime).toBe('Delivery Time');
    expect(translations.en.restaurant.deliveryFee).toBe('Delivery Fee');
  });

  it('should have order translations', () => {
    expect(translations.en.order.status).toBe('Order Status');
    expect(translations.en.order.total).toBe('Total');
    expect(translations.en.order.items).toBe('Items');
    expect(translations.en.order.deliveryAddress).toBe('Delivery Address');
  });

  it('should have user translations', () => {
    expect(translations.en.user.profile).toBe('Profile');
    expect(translations.en.user.settings).toBe('Settings');
    expect(translations.en.user.orders).toBe('My Orders');
    expect(translations.en.user.favorites).toBe('Favorites');
  });
});

describe('Language Switching', () => {
  it('should switch to English', () => {
    i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should switch to Arabic', () => {
    i18n.changeLanguage('ar');
    expect(i18n.language).toBe('ar');
  });

  it('should maintain translations after language switch', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('common.home')).toBe('Home');
    
    i18n.changeLanguage('ar');
    expect(i18n.t('common.home')).toBe('الرئيسية');
  });
});

describe('Translation Keys', () => {
  it('should have all required translation keys', () => {
    const requiredKeys = [
      'common.home',
      'common.about',
      'common.contact',
      'common.login',
      'common.register',
      'common.logout',
      'navigation.home',
      'navigation.restaurants',
      'navigation.orders',
      'navigation.profile',
      'restaurant.name',
      'restaurant.description',
      'restaurant.rating',
      'restaurant.deliveryTime',
      'restaurant.deliveryFee',
      'order.status',
      'order.total',
      'order.items',
      'order.deliveryAddress',
      'user.profile',
      'user.settings',
      'user.orders',
      'user.favorites',
    ];

    requiredKeys.forEach(key => {
      expect(i18n.exists(key)).toBe(true);
    });
  });
});

describe('Missing Translations', () => {
  it('should handle missing translations gracefully', () => {
    const missingKey = 'nonexistent.key';
    expect(i18n.t(missingKey)).toBe(missingKey);
  });

  it('should return fallback for missing translations', () => {
    const missingKey = 'nonexistent.key';
    const fallback = 'Fallback Text';
    expect(i18n.t(missingKey, { fallback })).toBe(fallback);
  });
});