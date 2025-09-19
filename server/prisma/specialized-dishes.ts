import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// أطباق مطعم النيل (أسماك ومأكولات بحرية)
const nileRestaurantDishes = [
  {
    name: 'Grilled Nile Fish',
    nameAr: 'سمك النيل المشوي',
    description: 'Fresh Nile fish grilled with herbs and spices',
    descriptionAr: 'سمك النيل الطازج مشوي بالأعشاب والبهارات',
    price: 95,
    preparationTime: 25,
    isPopular: true,
    ingredients: JSON.stringify(['nile fish', 'herbs', 'spices', 'lemon', 'olive oil']),
    calories: 280,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  },
  {
    name: 'Fish Sayadiya',
    nameAr: 'سمك صيادية',
    description: 'Traditional Egyptian fish with rice',
    descriptionAr: 'السمك الصيادي المصري التقليدي',
    price: 85,
    preparationTime: 30,
    isPopular: true,
    ingredients: JSON.stringify(['fish', 'rice', 'onions', 'spices', 'nuts']),
    calories: 450,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  },
  {
    name: 'Shrimp Tagine',
    nameAr: 'جمبري طاجن',
    description: 'Shrimp cooked in traditional tagine',
    descriptionAr: 'جمبري مطبوخ في الطاجن التقليدي',
    price: 120,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['shrimp', 'tomatoes', 'onions', 'spices', 'herbs']),
    calories: 200,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  },
  {
    name: 'Calamari Fritti',
    nameAr: 'كلاماري مقلي',
    description: 'Fried calamari rings',
    descriptionAr: 'حلقات الكلاماري المقلي',
    price: 75,
    preparationTime: 15,
    isPopular: true,
    ingredients: JSON.stringify(['calamari', 'flour', 'eggs', 'spices']),
    calories: 250,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  },
];

// أطباق مطعم الأقصر (مطبخ الصعيد)
const luxorRestaurantDishes = [
  {
    name: 'Fatta with Meat',
    nameAr: 'فتة باللحمة',
    description: 'Traditional Upper Egypt fatta with meat',
    descriptionAr: 'فتة الصعيد التقليدية باللحمة',
    price: 55,
    preparationTime: 25,
    isPopular: true,
    ingredients: JSON.stringify(['rice', 'bread', 'meat', 'garlic', 'vinegar']),
    calories: 400,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
  },
  {
    name: 'Mulukhiya with Rabbit',
    nameAr: 'ملوخية بالأرنب',
    description: 'Traditional mulukhiya with rabbit meat',
    descriptionAr: 'الملوخية التقليدية بلحم الأرنب',
    price: 70,
    preparationTime: 30,
    isPopular: true,
    ingredients: JSON.stringify(['mulukhiya', 'rabbit meat', 'garlic', 'coriander']),
    calories: 220,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
  },
  {
    name: 'Sayadiya Rice',
    nameAr: 'أرز صيادية',
    description: 'Traditional Upper Egypt rice dish',
    descriptionAr: 'طبق الأرز الصيادي التقليدي',
    price: 45,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['rice', 'onions', 'spices', 'nuts', 'raisins']),
    calories: 350,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
  },
  {
    name: 'Stuffed Pigeon',
    nameAr: 'حمام محشي',
    description: 'Traditional stuffed pigeon',
    descriptionAr: 'الحمام المحشي التقليدي',
    price: 90,
    preparationTime: 40,
    isPopular: true,
    ingredients: JSON.stringify(['pigeon', 'rice', 'spices', 'onions', 'herbs']),
    calories: 300,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
  },
];

// أطباق مطعم الفنتين (مطبخ عصري)
const elephantineRestaurantDishes = [
  {
    name: 'Grilled Chicken Breast',
    nameAr: 'صدر دجاج مشوي',
    description: 'Grilled chicken breast with herbs',
    descriptionAr: 'صدر دجاج مشوي بالأعشاب',
    price: 65,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['chicken breast', 'herbs', 'spices', 'olive oil']),
    calories: 200,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    name: 'Beef Steak',
    nameAr: 'ستيك لحم بقري',
    description: 'Grilled beef steak with vegetables',
    descriptionAr: 'ستيك لحم بقري مشوي مع الخضروات',
    price: 120,
    preparationTime: 25,
    isPopular: true,
    ingredients: JSON.stringify(['beef steak', 'vegetables', 'herbs', 'spices']),
    calories: 350,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    name: 'Pasta Carbonara',
    nameAr: 'باستا كاربونارا',
    description: 'Creamy pasta with bacon and cheese',
    descriptionAr: 'باستا كريمية مع لحم الخنزير المقدد والجبن',
    price: 55,
    preparationTime: 15,
    isPopular: true,
    ingredients: JSON.stringify(['pasta', 'cream', 'bacon', 'cheese', 'eggs']),
    calories: 450,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    name: 'Caesar Salad',
    nameAr: 'سلطة سيزر',
    description: 'Fresh Caesar salad with chicken',
    descriptionAr: 'سلطة سيزر طازجة مع الدجاج',
    price: 45,
    preparationTime: 10,
    isPopular: true,
    ingredients: JSON.stringify(['lettuce', 'chicken', 'croutons', 'parmesan', 'caesar dressing']),
    calories: 180,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
  },
];

// أطباق مطعم كوم أمبو (تخصصات محلية)
const komomboRestaurantDishes = [
  {
    name: 'Local Lamb Stew',
    nameAr: 'يخنة خروف محلية',
    description: 'Traditional local lamb stew',
    descriptionAr: 'يخنة الخروف المحلية التقليدية',
    price: 80,
    preparationTime: 35,
    isPopular: true,
    ingredients: JSON.stringify(['lamb', 'onions', 'tomatoes', 'spices', 'herbs']),
    calories: 300,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
  },
  {
    name: 'Aswan Chicken',
    nameAr: 'دجاج أسوان',
    description: 'Traditional Aswan style chicken',
    descriptionAr: 'الدجاج بطراز أسوان التقليدي',
    price: 60,
    preparationTime: 25,
    isPopular: true,
    ingredients: JSON.stringify(['chicken', 'aswan spices', 'onions', 'garlic']),
    calories: 250,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    name: 'Local Vegetable Stew',
    nameAr: 'يخنة خضروات محلية',
    description: 'Traditional local vegetable stew',
    descriptionAr: 'يخنة الخضروات المحلية التقليدية',
    price: 35,
    preparationTime: 20,
    isPopular: true,
    ingredients: JSON.stringify(['local vegetables', 'tomatoes', 'onions', 'spices']),
    calories: 150,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
  },
  {
    name: 'Aswan Rice',
    nameAr: 'أرز أسوان',
    description: 'Traditional Aswan rice dish',
    descriptionAr: 'طبق الأرز الأسواني التقليدي',
    price: 25,
    preparationTime: 15,
    isPopular: true,
    ingredients: JSON.stringify(['rice', 'aswan spices', 'onions', 'nuts']),
    calories: 200,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
  },
];

async function addSpecializedDishes() {
  console.log('🍽️ بدء إضافة الأطباق المتخصصة...');

  // إضافة أطباق مطعم النيل
  const nileRestaurant = await prisma.restaurant.findFirst({
    where: { nameAr: 'مطعم النيل' },
    include: { categories: true }
  });

  if (nileRestaurant) {
    const mainCategory = nileRestaurant.categories.find(cat => cat.nameAr === 'الأطباق الرئيسية');
    if (mainCategory) {
      for (const dish of nileRestaurantDishes) {
        await prisma.menuItem.create({
          data: {
            restaurantId: nileRestaurant.id,
            categoryId: mainCategory.id,
            ...dish,
          },
        });
      }
      console.log('✅ تم إضافة أطباق مطعم النيل');
    }
  }

  // إضافة أطباق مطعم الأقصر
  const luxorRestaurant = await prisma.restaurant.findFirst({
    where: { nameAr: 'مطعم الأقصر' },
    include: { categories: true }
  });

  if (luxorRestaurant) {
    const mainCategory = luxorRestaurant.categories.find(cat => cat.nameAr === 'الأطباق الرئيسية');
    if (mainCategory) {
      for (const dish of luxorRestaurantDishes) {
        await prisma.menuItem.create({
          data: {
            restaurantId: luxorRestaurant.id,
            categoryId: mainCategory.id,
            ...dish,
          },
        });
      }
      console.log('✅ تم إضافة أطباق مطعم الأقصر');
    }
  }

  // إضافة أطباق مطعم الفنتين
  const elephantineRestaurant = await prisma.restaurant.findFirst({
    where: { nameAr: 'مطعم الفنتين' },
    include: { categories: true }
  });

  if (elephantineRestaurant) {
    const mainCategory = elephantineRestaurant.categories.find(cat => cat.nameAr === 'الأطباق الرئيسية');
    if (mainCategory) {
      for (const dish of elephantineRestaurantDishes) {
        await prisma.menuItem.create({
          data: {
            restaurantId: elephantineRestaurant.id,
            categoryId: mainCategory.id,
            ...dish,
          },
        });
      }
      console.log('✅ تم إضافة أطباق مطعم الفنتين');
    }
  }

  // إضافة أطباق مطعم كوم أمبو
  const komomboRestaurant = await prisma.restaurant.findFirst({
    where: { nameAr: 'مطعم كوم أمبو' },
    include: { categories: true }
  });

  if (komomboRestaurant) {
    const mainCategory = komomboRestaurant.categories.find(cat => cat.nameAr === 'الأطباق الرئيسية');
    if (mainCategory) {
      for (const dish of komomboRestaurantDishes) {
        await prisma.menuItem.create({
          data: {
            restaurantId: komomboRestaurant.id,
            categoryId: mainCategory.id,
            ...dish,
          },
        });
      }
      console.log('✅ تم إضافة أطباق مطعم كوم أمبو');
    }
  }

  console.log('🎉 تم الانتهاء من إضافة الأطباق المتخصصة!');
}

addSpecializedDishes()
  .catch((e) => {
    console.error('❌ خطأ في إضافة الأطباق المتخصصة:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
