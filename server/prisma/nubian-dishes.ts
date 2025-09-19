import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// أطباق نوبية ومحلية أصيلة من أسوان
const nubianDishes = [
  // أطباق نوبية تقليدية
  {
    name: 'Kisra',
    nameAr: 'كسرة',
    description: 'Traditional Nubian bread made from sorghum',
    descriptionAr: 'خبز نوبي تقليدي من الذرة الرفيعة',
    price: 15,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['sorghum flour', 'water', 'salt']),
    calories: 120,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
  },
  {
    name: 'Ful Medames',
    nameAr: 'فول مدمس',
    description: 'Traditional Egyptian fava beans stew',
    descriptionAr: 'فول مدمس مصري تقليدي',
    price: 25,
    preparationTime: 15,
    isPopular: true,
    ingredients: JSON.stringify(['fava beans', 'garlic', 'lemon', 'olive oil']),
    calories: 200,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
  },
  {
    name: 'Nubian Fish',
    nameAr: 'سمك نوبي',
    description: 'Fresh Nile fish with traditional Nubian spices',
    descriptionAr: 'سمك النيل الطازج مع البهارات النوبية التقليدية',
    price: 85,
    preparationTime: 25,
    isPopular: true,
    ingredients: JSON.stringify(['nile fish', 'nubian spices', 'onions', 'tomatoes']),
    calories: 300,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  },
  {
    name: 'Bamya',
    nameAr: 'بامية',
    description: 'Traditional okra stew with meat',
    descriptionAr: 'طبق البامية التقليدي باللحمة',
    price: 65,
    preparationTime: 30,
    isPopular: true,
    ingredients: JSON.stringify(['okra', 'meat', 'onions', 'tomatoes', 'garlic']),
    calories: 250,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    name: 'Molokhia',
    nameAr: 'ملوخية',
    description: 'Green soup with chicken or meat',
    descriptionAr: 'الشوربة الخضراء بالفراخ أو اللحمة',
    price: 55,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['molokhia leaves', 'chicken', 'garlic', 'coriander']),
    calories: 180,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
  },
  {
    name: 'Koshari',
    nameAr: 'كشري',
    description: 'Traditional Egyptian rice and lentils dish',
    descriptionAr: 'طبق الكشري المصري التقليدي',
    price: 35,
    preparationTime: 15,
    isPopular: true,
    ingredients: JSON.stringify(['rice', 'lentils', 'pasta', 'chickpeas', 'tomato sauce']),
    calories: 400,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
  },
  {
    name: 'Mahshi',
    nameAr: 'محشي',
    description: 'Stuffed vegetables with rice and herbs',
    descriptionAr: 'خضروات محشية بالأرز والأعشاب',
    price: 45,
    preparationTime: 35,
    isPopular: true,
    ingredients: JSON.stringify(['zucchini', 'eggplant', 'rice', 'herbs', 'tomatoes']),
    calories: 220,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    name: 'Fattah',
    nameAr: 'فتة',
    description: 'Traditional Egyptian dish with rice and bread',
    descriptionAr: 'طبق الفتة المصري التقليدي',
    price: 40,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['rice', 'bread', 'meat', 'garlic', 'vinegar']),
    calories: 350,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
  },
];

// مقبلات نوبية
const nubianAppetizers = [
  {
    name: 'Tahina Salad',
    nameAr: 'سلطة طحينة',
    description: 'Fresh tahina with vegetables',
    descriptionAr: 'طحينة طازجة بالخضروات',
    price: 25,
    preparationTime: 10,
    isPopular: false,
    ingredients: JSON.stringify(['tahina', 'lemon', 'garlic', 'vegetables']),
    calories: 150,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
  },
  {
    name: 'Baba Ganoush',
    nameAr: 'بابا غنوج',
    description: 'Grilled eggplant dip',
    descriptionAr: 'غمسة الباذنجان المشوي',
    price: 30,
    preparationTime: 15,
    isPopular: true,
    ingredients: JSON.stringify(['eggplant', 'tahina', 'lemon', 'garlic']),
    calories: 120,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
  },
  {
    name: 'Hummus',
    nameAr: 'حمص',
    description: 'Traditional chickpea dip',
    descriptionAr: 'غمسة الحمص التقليدية',
    price: 28,
    preparationTime: 12,
    isPopular: true,
    ingredients: JSON.stringify(['chickpeas', 'tahina', 'lemon', 'garlic', 'olive oil']),
    calories: 180,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
  },
  {
    name: 'Falafel',
    nameAr: 'فلافل',
    description: 'Traditional Egyptian falafel',
    descriptionAr: 'الفلافل المصري التقليدي',
    price: 20,
    preparationTime: 8,
    isPopular: true,
    ingredients: JSON.stringify(['chickpeas', 'herbs', 'spices', 'onions']),
    calories: 200,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
  },
];

// مشروبات نوبية ومحلية
const nubianBeverages = [
  {
    name: 'Karkadeh',
    nameAr: 'كركديه',
    description: 'Traditional hibiscus tea',
    descriptionAr: 'شاي الكركديه التقليدي',
    price: 15,
    preparationTime: 5,
    isPopular: true,
    ingredients: JSON.stringify(['hibiscus flowers', 'sugar', 'water']),
    calories: 50,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
  },
  {
    name: 'Sahlab',
    nameAr: 'سحلب',
    description: 'Traditional hot milk drink',
    descriptionAr: 'مشروب الحليب الساخن التقليدي',
    price: 20,
    preparationTime: 8,
    isPopular: true,
    ingredients: JSON.stringify(['milk', 'sahlab powder', 'sugar', 'cinnamon']),
    calories: 120,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
  },
  {
    name: 'Fresh Orange Juice',
    nameAr: 'عصير برتقال طازج',
    description: 'Freshly squeezed orange juice',
    descriptionAr: 'عصير برتقال طازج معصور',
    price: 18,
    preparationTime: 3,
    isPopular: true,
    ingredients: JSON.stringify(['fresh oranges']),
    calories: 80,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
  },
  {
    name: 'Mango Juice',
    nameAr: 'عصير مانجو',
    description: 'Fresh mango juice',
    descriptionAr: 'عصير مانجو طازج',
    price: 22,
    preparationTime: 5,
    isPopular: true,
    ingredients: JSON.stringify(['fresh mango', 'sugar', 'water']),
    calories: 100,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
  },
];

// حلويات نوبية ومحلية
const nubianDesserts = [
  {
    name: 'Umm Ali',
    nameAr: 'أم علي',
    description: 'Traditional Egyptian bread pudding',
    descriptionAr: 'بودنج الخبز المصري التقليدي',
    price: 35,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['bread', 'milk', 'sugar', 'nuts', 'raisins']),
    calories: 300,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
  },
  {
    name: 'Basbousa',
    nameAr: 'بسبوسة',
    description: 'Traditional semolina cake',
    descriptionAr: 'كيك السميد التقليدي',
    price: 25,
    preparationTime: 15,
    isPopular: true,
    ingredients: JSON.stringify(['semolina', 'sugar', 'coconut', 'syrup']),
    calories: 250,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
  },
  {
    name: 'Konafa',
    nameAr: 'كنافة',
    description: 'Traditional shredded pastry',
    descriptionAr: 'المعجنات المقطعة التقليدية',
    price: 40,
    preparationTime: 25,
    isPopular: true,
    ingredients: JSON.stringify(['konafa dough', 'cheese', 'syrup', 'nuts']),
    calories: 400,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
  },
  {
    name: 'Mahalabia',
    nameAr: 'مهلبية',
    description: 'Traditional milk pudding',
    descriptionAr: 'بودنج الحليب التقليدي',
    price: 20,
    preparationTime: 12,
    isPopular: true,
    ingredients: JSON.stringify(['milk', 'sugar', 'rice flour', 'rose water']),
    calories: 180,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
  },
];

async function addNubianDishes() {
  console.log('🍽️ بدء إضافة الأطباق النوبية...');

  // الحصول على جميع المطاعم
  const restaurants = await prisma.restaurant.findMany({
    where: {
      nameAr: {
        in: ['مطعم النوبة', 'مطعم الفيروز', 'مطعم الكرنك', 'مطعم أبو سمبل']
      }
    },
    include: {
      categories: true
    }
  });

  for (const restaurant of restaurants) {
    console.log(`📝 إضافة أطباق لمطعم ${restaurant.nameAr}...`);

    // إضافة الأطباق الرئيسية
    const mainCategory = restaurant.categories.find(cat => cat.nameAr === 'الأطباق الرئيسية');
    if (mainCategory) {
      for (const dish of nubianDishes) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: mainCategory.id,
            ...dish,
          },
        });
      }
    }

    // إضافة المقبلات
    const appetizerCategory = restaurant.categories.find(cat => cat.nameAr === 'المقبلات');
    if (appetizerCategory) {
      for (const appetizer of nubianAppetizers) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: appetizerCategory.id,
            ...appetizer,
          },
        });
      }
    }

    // إضافة المشروبات
    const beverageCategory = restaurant.categories.find(cat => cat.nameAr === 'المشروبات');
    if (beverageCategory) {
      for (const beverage of nubianBeverages) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: beverageCategory.id,
            ...beverage,
          },
        });
      }
    }

    // إضافة الحلويات
    const dessertCategory = restaurant.categories.find(cat => cat.nameAr === 'الحلويات');
    if (dessertCategory) {
      for (const dessert of nubianDesserts) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: dessertCategory.id,
            ...dessert,
          },
        });
      }
    }

    console.log(`✅ تم إضافة جميع الأطباق لمطعم ${restaurant.nameAr}`);
  }

  console.log('🎉 تم الانتهاء من إضافة الأطباق النوبية!');
}

addNubianDishes()
  .catch((e) => {
    console.error('❌ خطأ في إضافة الأطباق:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
