import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏺 بدء إضافة مطاعم أسوان الحقيقية...');

  // إنشاء أصحاب مطاعم أسوان
  const userPassword = await bcrypt.hash('owner123', 12);

  // أصحاب مطاعم أسوان الحقيقية
  const aswanOwners = await Promise.all([
    // مطعم النوبة
    prisma.user.create({
      data: {
        email: 'nubia.restaurant@aswanfood.com',
        phone: '+201234567001',
        password: userPassword,
        firstName: 'أحمد',
        lastName: 'النوبي',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
    // مطعم الفيروز
    prisma.user.create({
      data: {
        email: 'fayrouz.restaurant@aswanfood.com',
        phone: '+201234567002',
        password: userPassword,
        firstName: 'فاطمة',
        lastName: 'النوبية',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
    // مطعم الكرنك
    prisma.user.create({
      data: {
        email: 'karnak.restaurant@aswanfood.com',
        phone: '+201234567003',
        password: userPassword,
        firstName: 'محمد',
        lastName: 'الكرنكي',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
    // مطعم أبو سمبل
    prisma.user.create({
      data: {
        email: 'abusimbel.restaurant@aswanfood.com',
        phone: '+201234567004',
        password: userPassword,
        firstName: 'خالد',
        lastName: 'أبو سمبل',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
    // مطعم النيل
    prisma.user.create({
      data: {
        email: 'nile.restaurant@aswanfood.com',
        phone: '+201234567005',
        password: userPassword,
        firstName: 'سارة',
        lastName: 'النيلية',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
    // مطعم الأقصر
    prisma.user.create({
      data: {
        email: 'luxor.restaurant@aswanfood.com',
        phone: '+201234567006',
        password: userPassword,
        firstName: 'علي',
        lastName: 'الأقصر',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
    // مطعم الفنتين
    prisma.user.create({
      data: {
        email: 'elephantine.restaurant@aswanfood.com',
        phone: '+201234567007',
        password: userPassword,
        firstName: 'مريم',
        lastName: 'الفنتين',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
    // مطعم كوم أمبو
    prisma.user.create({
      data: {
        email: 'komombo.restaurant@aswanfood.com',
        phone: '+201234567008',
        password: userPassword,
        firstName: 'حسن',
        lastName: 'كوم أمبو',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    }),
  ]);

  console.log('✅ تم إنشاء أصحاب المطاعم');

  // إنشاء مطاعم أسوان الحقيقية
  const aswanRestaurants = await Promise.all([
    // مطعم النوبة
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[0].id,
        name: 'Nubia Restaurant',
        nameAr: 'مطعم النوبة',
        description: 'Authentic Nubian cuisine with traditional flavors',
        descriptionAr: 'مطبخ نوبي أصيل بنكهات تقليدية',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
        address: 'شارع النيل، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567001',
        email: 'info@nubia-restaurant.com',
        deliveryTime: 25,
        deliveryFee: 15,
        minimumOrder: 50,
        rating: 4.8,
        totalReviews: 156,
        openingTime: '10:00',
        closingTime: '23:00',
      },
    }),
    // مطعم الفيروز
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[1].id,
        name: 'Fayrouz Restaurant',
        nameAr: 'مطعم الفيروز',
        description: 'Traditional Egyptian cuisine with Nubian influences',
        descriptionAr: 'مطبخ مصري تقليدي بتأثيرات نوبية',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
        address: 'شارع الكورنيش، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567002',
        email: 'info@fayrouz-restaurant.com',
        deliveryTime: 30,
        deliveryFee: 20,
        minimumOrder: 60,
        rating: 4.6,
        totalReviews: 89,
        openingTime: '09:00',
        closingTime: '24:00',
      },
    }),
    // مطعم الكرنك
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[2].id,
        name: 'Karnak Restaurant',
        nameAr: 'مطعم الكرنك',
        description: 'Fine dining with Egyptian and international cuisine',
        descriptionAr: 'مطعم راقي بالمطبخ المصري والعالمي',
        image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
        address: 'شارع المعبد، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567003',
        email: 'info@karnak-restaurant.com',
        deliveryTime: 35,
        deliveryFee: 25,
        minimumOrder: 80,
        rating: 4.9,
        totalReviews: 234,
        openingTime: '12:00',
        closingTime: '23:00',
      },
    }),
    // مطعم أبو سمبل
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[3].id,
        name: 'Abu Simbel Restaurant',
        nameAr: 'مطعم أبو سمبل',
        description: 'Traditional Nubian dishes and grilled specialties',
        descriptionAr: 'أطباق نوبية تقليدية ومشويات مميزة',
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=400&fit=crop',
        address: 'شارع أبو سمبل، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567004',
        email: 'info@abusimbel-restaurant.com',
        deliveryTime: 20,
        deliveryFee: 15,
        minimumOrder: 45,
        rating: 4.7,
        totalReviews: 178,
        openingTime: '11:00',
        closingTime: '22:00',
      },
    }),
    // مطعم النيل
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[4].id,
        name: 'Nile Restaurant',
        nameAr: 'مطعم النيل',
        description: 'Fresh fish and seafood from the Nile',
        descriptionAr: 'أسماك طازجة ومأكولات بحرية من النيل',
        image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=400&fit=crop',
        address: 'شارع النيل، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567005',
        email: 'info@nile-restaurant.com',
        deliveryTime: 25,
        deliveryFee: 18,
        minimumOrder: 55,
        rating: 4.5,
        totalReviews: 142,
        openingTime: '10:00',
        closingTime: '23:00',
      },
    }),
    // مطعم الأقصر
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[5].id,
        name: 'Luxor Restaurant',
        nameAr: 'مطعم الأقصر',
        description: 'Traditional Upper Egypt cuisine',
        descriptionAr: 'مطبخ الصعيد التقليدي',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
        address: 'شارع الأقصر، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567006',
        email: 'info@luxor-restaurant.com',
        deliveryTime: 30,
        deliveryFee: 20,
        minimumOrder: 50,
        rating: 4.4,
        totalReviews: 98,
        openingTime: '09:00',
        closingTime: '23:00',
      },
    }),
    // مطعم الفنتين
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[6].id,
        name: 'Elephantine Restaurant',
        nameAr: 'مطعم الفنتين',
        description: 'Modern Egyptian cuisine with traditional touches',
        descriptionAr: 'مطبخ مصري عصري بلمسات تقليدية',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
        address: 'جزيرة الفنتين، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567007',
        email: 'info@elephantine-restaurant.com',
        deliveryTime: 35,
        deliveryFee: 25,
        minimumOrder: 70,
        rating: 4.6,
        totalReviews: 167,
        openingTime: '12:00',
        closingTime: '24:00',
      },
    }),
    // مطعم كوم أمبو
    prisma.restaurant.create({
      data: {
        ownerId: aswanOwners[7].id,
        name: 'Kom Ombo Restaurant',
        nameAr: 'مطعم كوم أمبو',
        description: 'Local Aswan specialties and traditional dishes',
        descriptionAr: 'تخصصات أسوان المحلية وأطباق تقليدية',
        image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
        address: 'شارع كوم أمبو، أسوان',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: '+201234567008',
        email: 'info@komombo-restaurant.com',
        deliveryTime: 25,
        deliveryFee: 15,
        minimumOrder: 40,
        rating: 4.3,
        totalReviews: 76,
        openingTime: '10:00',
        closingTime: '22:00',
      },
    }),
  ]);

  console.log('✅ تم إنشاء مطاعم أسوان');

  // إنشاء فئات الأطباق لكل مطعم
  for (const restaurant of aswanRestaurants) {
    const categories = await Promise.all([
      // الأطباق الرئيسية
      prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: 'Main Dishes',
          nameAr: 'الأطباق الرئيسية',
          description: 'Traditional main courses - الأطباق الرئيسية التقليدية',
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop',
          sortOrder: 1,
        },
      }),
      // المقبلات
      prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: 'Appetizers',
          nameAr: 'المقبلات',
          description: 'Traditional appetizers and starters - مقبلات وفتات تقليدية',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop',
          sortOrder: 2,
        },
      }),
      // المشروبات
      prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: 'Beverages',
          nameAr: 'المشروبات',
          description: 'Traditional and modern beverages - مشروبات تقليدية وعصرية',
          image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=200&fit=crop',
          sortOrder: 3,
        },
      }),
      // الحلويات
      prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: 'Desserts',
          nameAr: 'الحلويات',
          description: 'Traditional Egyptian desserts - حلويات مصرية تقليدية',
          image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop',
          sortOrder: 4,
        },
      }),
    ]);

    console.log(`✅ تم إنشاء فئات مطعم ${restaurant.nameAr}`);
  }

  console.log('🎉 تم الانتهاء من إضافة مطاعم أسوان!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إضافة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
