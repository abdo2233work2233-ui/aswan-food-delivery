import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store';
import { selectOrderById } from '../store/slices/orderSlice';
import { selectUser } from '../store/slices/authSlice';
import {
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiShoppingBag,
  FiTruck,
  FiHome,
  FiStar,
  FiMessageCircle,
  FiArrowRight,
  FiPhone,
  FiMail,
  FiCircle,
  FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { FiArrowUp } from 'react-icons/fi';

const OrderConfirmationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orderId } = useParams<{ orderId: string }>();
  const order = useAppSelector(state => orderId ? selectOrderById(orderId)(state) : null);
  const user = useAppSelector(selectUser);
  
  const currentLanguage = i18n.language;
  const isArabic = currentLanguage === 'ar';

  // Local state
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>('');

  useEffect(() => {
    if (!orderId || !order) {
      navigate('/orders');
      return;
    }

    // Calculate estimated delivery time
    if (order.restaurant && order.createdAt) {
      const orderTime = new Date(order.createdAt);
      const deliveryTime = order.restaurant.deliveryTime;
      const estimatedTime = new Date(orderTime.getTime() + deliveryTime * 60000);
      
      const timeString = estimatedTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      setEstimatedDeliveryTime(timeString);
    }
  }, [orderId, order, navigate]);

  const getOrderStatusInfo = (status: string) => {
    const statusMap = {
      PENDING: {
        icon: FiClock,
        title: isArabic ? 'في الانتظار' : 'Pending',
        description: isArabic ? 'تم استلام طلبك وسيتم تأكيده قريباً' : 'Your order has been received and will be confirmed soon',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      CONFIRMED: {
        icon: FiCheckCircle,
        title: isArabic ? 'تم التأكيد' : 'Confirmed',
        description: isArabic ? 'تم تأكيد طلبك وسيبدأ التحضير' : 'Your order has been confirmed and preparation will begin',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      PREPARING: {
        icon: FiShoppingBag,
        title: isArabic ? 'جاري التحضير' : 'Preparing',
        description: isArabic ? 'المطعم يعد طلبك الآن' : 'The restaurant is preparing your order now',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      READY_FOR_PICKUP: {
        icon: FiTruck,
        title: isArabic ? 'جاهز للاستلام' : 'Ready for Pickup',
        description: isArabic ? 'طلبك جاهز وسيتم تسليمه قريباً' : 'Your order is ready and will be delivered soon',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      OUT_FOR_DELIVERY: {
        icon: FiTruck,
        title: isArabic ? 'في الطريق' : 'Out for Delivery',
        description: isArabic ? 'طلبك في الطريق إليك' : 'Your order is on its way to you',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200'
      },
      DELIVERED: {
        icon: FiCheckCircle,
        title: isArabic ? 'تم التسليم' : 'Delivered',
        description: isArabic ? 'تم تسليم طلبك بنجاح' : 'Your order has been delivered successfully',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      CANCELLED: {
        icon: FiCheckCircle,
        title: isArabic ? 'ملغي' : 'Cancelled',
        description: isArabic ? 'تم إلغاء طلبك' : 'Your order has been cancelled',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.PENDING;
  };

  const getPaymentStatusInfo = (status: string) => {
    const statusMap = {
      PENDING: {
        title: isArabic ? 'في الانتظار' : 'Pending',
        color: 'text-yellow-600'
      },
      COMPLETED: {
        title: isArabic ? 'مكتمل' : 'Completed',
        color: 'text-green-600'
      },
      FAILED: {
        title: isArabic ? 'فشل' : 'Failed',
        color: 'text-red-600'
      },
      REFUNDED: {
        title: isArabic ? 'مسترد' : 'Refunded',
        color: 'text-blue-600'
      }
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.PENDING;
  };

  if (!order) {
    return null;
  }

  const statusInfo = getOrderStatusInfo(order.status);
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            {isArabic ? 'تم تأكيد طلبك!' : 'Order Confirmed!'}
          </h1>
          <p className="text-neutral-600 text-lg">
            {isArabic ? 'شكراً لك! سنرسل لك تحديثات حول طلبك' : 'Thank you! We\'ll send you updates about your order'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl shadow-soft p-6 border-l-4 ${statusInfo.borderColor}`}
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                <statusInfo.icon className={`h-6 w-6 ${statusInfo.color}`} />
                <h2 className="text-lg font-semibold text-neutral-800">
                  {isArabic ? 'حالة الطلب' : 'Order Status'}
                </h2>
              </div>
              
              <div className={`p-4 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
                <h3 className={`font-semibold ${statusInfo.color} mb-2`}>
                  {statusInfo.title}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {statusInfo.description}
                </p>
              </div>

              {estimatedDeliveryTime && (
                <div className="mt-4 flex items-center space-x-2 rtl:space-x-reverse text-sm text-neutral-600">
                  <FiClock className="h-4 w-4" />
                  <span>
                    {isArabic ? 'الوقت المتوقع للتسليم:' : 'Estimated delivery time:'} {estimatedDeliveryTime}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Order Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-soft p-6"
            >
              <h2 className="text-lg font-semibold text-neutral-800 mb-6">
                {isArabic ? 'تفاصيل الطلب' : 'Order Details'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-600 mb-2">
                    {isArabic ? 'رقم الطلب' : 'Order Number'}
                  </h3>
                  <p className="text-lg font-semibold text-neutral-800">{order.orderNumber}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-600 mb-2">
                    {isArabic ? 'تاريخ الطلب' : 'Order Date'}
                  </h3>
                  <p className="text-neutral-800">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-600 mb-2">
                    {isArabic ? 'طريقة الدفع' : 'Payment Method'}
                  </h3>
                  <p className="text-neutral-800">
                    {order.paymentMethod === 'CASH' 
                      ? (isArabic ? 'دفع نقدي عند التسليم' : 'Cash on Delivery')
                      : (isArabic ? 'بطاقة ائتمان' : 'Credit Card')
                    }
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-600 mb-2">
                    {isArabic ? 'حالة الدفع' : 'Payment Status'}
                  </h3>
                  <p className={`font-medium ${paymentStatusInfo.color}`}>
                    {paymentStatusInfo.title}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Restaurant Information */}
            {order.restaurant && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <h2 className="text-lg font-semibold text-neutral-800 mb-6">
                  {isArabic ? 'معلومات المطعم' : 'Restaurant Information'}
                </h2>

                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  {order.restaurant.image && (
                    <img
                      src={order.restaurant.image}
                      alt={isArabic ? order.restaurant.nameAr : order.restaurant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-800 mb-1">
                      {isArabic ? order.restaurant.nameAr : order.restaurant.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      {isArabic ? order.restaurant.descriptionAr : order.restaurant.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-neutral-500">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <FiStar className="h-4 w-4 text-yellow-500" />
                        <span>{order.restaurant.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <FiClock className="h-4 w-4" />
                        <span>{order.restaurant.deliveryTime} {isArabic ? 'دقيقة' : 'min'}</span>
                      </div>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <FiMapPin className="h-4 w-4" />
                        <span>{order.restaurant.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 rtl:space-x-reverse mt-3">
                      <a
                        href={`tel:${order.restaurant.phone}`}
                        className="flex items-center space-x-2 rtl:space-x-reverse text-primary-600 hover:text-primary-700 text-sm"
                      >
                        <FiPhone className="h-4 w-4" />
                        <span>{isArabic ? 'اتصل' : 'Call'}</span>
                      </a>
                      {order.restaurant.email && (
                        <a
                          href={`mailto:${order.restaurant.email}`}
                          className="flex items-center space-x-2 rtl:space-x-reverse text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <FiMail className="h-4 w-4" />
                          <span>{isArabic ? 'إيميل' : 'Email'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Delivery Address */}
            {order.address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <h2 className="text-lg font-semibold text-neutral-800 mb-6">
                  {isArabic ? 'عنوان التوصيل' : 'Delivery Address'}
                </h2>

                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <FiMapPin className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-neutral-800 mb-1">{order.address.title}</h3>
                    <p className="text-neutral-600 mb-1">{order.address.address}</p>
                    <p className="text-sm text-neutral-500">
                      {order.address.city}, {order.address.governorate}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">
                  {isArabic ? 'ملاحظات الطلب' : 'Order Notes'}
                </h2>
                <p className="text-neutral-600">{order.notes}</p>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-neutral-800 mb-6">
                {isArabic ? 'ملخص الطلب' : 'Order Summary'}
              </h3>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-4 mb-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <span className="w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-neutral-800">
                          {isArabic ? item.menuItem?.nameAr : item.menuItem?.name}
                        </h4>
                        {item.notes && (
                          <p className="text-xs text-neutral-500 mt-1">{item.notes}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-neutral-800">
                        {(item.price * item.quantity).toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span>{order.subtotal.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">{isArabic ? 'رسوم التوصيل:' : 'Delivery fee:'}</span>
                  <span>
                    {order.deliveryFee === 0 
                      ? (isArabic ? 'مجاني' : 'Free')
                      : `${order.deliveryFee.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}`
                    }
                  </span>
                </div>

                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">{isArabic ? 'الضرائب:' : 'Tax:'}</span>
                    <span>{order.tax.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
                  </div>
                )}

                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{isArabic ? 'الخصم:' : 'Discount:'}</span>
                    <span>-{order.discount.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-semibold mb-6">
                <span>{isArabic ? 'المجموع:' : 'Total:'}</span>
                <span>{order.total.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <FiMessageCircle className="h-5 w-5" />
                  <span>{isArabic ? 'تتبع الطلب' : 'Track Order'}</span>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="btn btn-outline w-full flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <FiHome className="h-5 w-5" />
                  <span>{isArabic ? 'العودة للرئيسية' : 'Back to Home'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;