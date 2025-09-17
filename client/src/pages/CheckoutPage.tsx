import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectCart,
  selectCartItems,
  selectCartIsEmpty,
  clearCart,
} from '../store/slices/cartSlice';
import {
  fetchAddresses,
  selectAddresses,
  selectDefaultAddress,
  selectUserLoading,
} from '../store/slices/userSlice';
import { createOrder, selectOrderCreating } from '../store/slices/orderSlice';
import { selectUser } from '../store/slices/authSlice';
import { PaymentMethod } from '../types';
import * as orderService from '../services/orderService';
import {
  FiMapPin,
  FiCircle,
  FiPlus,
  FiCheck,
  FiArrowLeft,
  FiShoppingBag,
  FiLock,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Validation schema with enhanced security
const checkoutSchema = yup.object({
  addressId: yup
    .string()
    .required('Please select a delivery address')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Invalid address ID format'),
  paymentMethod: yup
    .string()
    .required('Please select a payment method')
    .oneOf(['CASH', 'CARD', 'WALLET'], 'Invalid payment method'),
  notes: yup
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .test('no-scripts', 'Notes contain invalid content', (value) => {
      if (!value) return true;
      // Prevent XSS attacks
      const scriptPattern = /<script|javascript:|on\w+=/i;
      return !scriptPattern.test(value);
    })
    .optional(),
  couponCode: yup
    .string()
    .max(20, 'Coupon code cannot exceed 20 characters')
    .matches(/^[A-Z0-9-_]*$/, 'Coupon code can only contain letters, numbers, hyphens, and underscores')
    .optional(),
}) as yup.ObjectSchema<CheckoutFormData>;

type CheckoutFormData = {
  addressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
};

const CheckoutPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const cartItems = useAppSelector(selectCartItems);
  const isEmpty = useAppSelector(selectCartIsEmpty);
  const addresses = useAppSelector(selectAddresses);
  const defaultAddress = useAppSelector(selectDefaultAddress);
  const userLoading = useAppSelector(selectUserLoading);
  const orderCreating = useAppSelector(selectOrderCreating);
  const user = useAppSelector(selectUser);
  
  const currentLanguage = i18n.language;
  const isArabic = currentLanguage === 'ar';

  // Local state
  const [step, setStep] = useState(1);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  // FIX: Add state to track form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.CASH,
      addressId: defaultAddress?.id || '',
    },
  });

  const selectedAddressId = watch('addressId');
  const selectedPaymentMethod = watch('paymentMethod');
  const couponCode = watch('couponCode');
  const notes = watch('notes');

  useEffect(() => {
    // FIX: Add !isSubmitting check to prevent redirect during submission
    if (isEmpty && !isSubmitting) {
      navigate('/cart');
      return;
    }

    dispatch(fetchAddresses());
    // FIX: Add isSubmitting to dependency array
  }, [dispatch, isEmpty, navigate, isSubmitting]);

  useEffect(() => {
    if (defaultAddress) {
      setValue('addressId', defaultAddress.id);
    } else if (addresses.length > 0 && !selectedAddressId) {
      // If no default address but addresses are available, set the first one
      setValue('addressId', addresses[0].id);
    }
  }, [defaultAddress, addresses, setValue, selectedAddressId]);

  // Update step based on form completion
  useEffect(() => {
    if (selectedAddressId) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [selectedAddressId]);

  const onSubmit = async (data: CheckoutFormData) => {
    // FIX: Set submitting flag to true
    setIsSubmitting(true);
    try {
      // Additional client-side validation
      if (!cart.restaurantId) {
        toast.error(isArabic ? 'خطأ في معرف المطعم' : 'Restaurant ID error');
        setIsSubmitting(false); // Reset on failure
        return;
      }

      if (cartItems.length === 0) {
        toast.error(isArabic ? 'السلة فارغة' : 'Cart is empty');
        setIsSubmitting(false); // Reset on failure
        return;
      }

      // Validate total quantity
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity > 100) {
        toast.error(isArabic ? 'الكمية الإجمالية تتجاوز الحد المسموح' : 'Total quantity exceeds limit');
        setIsSubmitting(false); // Reset on failure
        return;
      }

      // Sanitize input data
      const sanitizedData = {
        restaurantId: cart.restaurantId,
        addressId: data.addressId.trim(),
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: Math.max(1, Math.min(50, Math.floor(item.quantity))), // Ensure valid range
          notes: item.notes?.trim().substring(0, 200) || undefined, // Limit length
        })),
        paymentMethod: data.paymentMethod,
        notes: data.notes?.trim().substring(0, 500) || undefined, // Limit length
        couponCode: data.couponCode?.trim().toUpperCase().substring(0, 20) || undefined, // Normalize and limit
      };

      // Validate address belongs to user
      const selectedAddress = addresses.find(addr => addr.id === data.addressId);
      if (!selectedAddress) {
        toast.error(isArabic ? 'عنوان غير صالح' : 'Invalid address');
        setIsSubmitting(false); // Reset on failure
        return;
      }

      const result = await dispatch(createOrder(sanitizedData));
      
      if (createOrder.fulfilled.match(result)) {
        dispatch(clearCart());
        
        // Clear coupon state
        setCouponError(null);
        setCouponSuccess(null);
        setAppliedDiscount(0);
        
        toast.success(
          isArabic ? 'تم إنشاء الطلب بنجاح!' : 'Order placed successfully!'
        );
        
        // Handle different payment methods
        if (data.paymentMethod === PaymentMethod.CARD) {
          // Redirect to payment page for card payments
          navigate(`/payment/${result.payload.id}`);
        } else {
          // Cash payment - go to order confirmation page
          navigate(`/order-confirmation/${result.payload.id}`);
        }
      } else {
        const errorMessage = (result.payload as string) || 
          (isArabic ? 'فشل في إنشاء الطلب' : 'Failed to place order');
        
        toast.error(errorMessage);
        setIsSubmitting(false); // Reset on failure
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(
        isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'
      );
      setIsSubmitting(false); // Reset on error
    }
  };

  if (isEmpty && !isSubmitting) {
    return null;
  }

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-neutral-800">
              {isArabic ? 'إتمام الطلب' : 'Checkout'}
            </h1>
            <p className="text-neutral-600 mt-1">
              {isArabic ? 'راجع طلبك وأكمل عملية الشراء' : 'Review your order and complete your purchase'}
            </p>
          </div>

          <button
            onClick={() => navigate('/cart')}
            className="btn btn-outline flex items-center space-x-2 rtl:space-x-reverse"
          >
            <FiArrowLeft className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
            <span>{isArabic ? 'رجوع للسلة' : 'Back to Cart'}</span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
            {[
              { num: 1, title: isArabic ? 'العنوان' : 'Address' },
              { num: 2, title: isArabic ? 'الدفع' : 'Payment' },
              { num: 3, title: isArabic ? 'التأكيد' : 'Confirm' },
            ].map((stepItem, index) => (
              <div key={stepItem.num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepItem.num
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {step > stepItem.num ? <FiCheck className="h-5 w-5" /> : stepItem.num}
                </div>
                <span className={`ml-2 rtl:ml-0 rtl:mr-2 text-sm font-medium ${
                  step >= stepItem.num ? 'text-primary-600' : 'text-neutral-500'
                }`}>
                  {stepItem.title}
                </span>
                {index < 2 && (
                  <div className={`w-8 h-px mx-4 ${
                    step > stepItem.num ? 'bg-primary-500' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Form Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiX className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {isArabic ? 'فشل في التحقق' : 'Validation failed'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>
                        {error?.message || `${field} is required`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Address Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {step > 1 ? <FiCheck className="h-4 w-4" /> : '1'}
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-800">
                    {isArabic ? 'عنوان التوصيل' : 'Delivery Address'}
                  </h2>
                </div>

                {userLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-neutral-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                        onClick={() => setValue('addressId', address.id)}
                      >
                        <input
                          type="radio"
                          name="addressId"
                          value={address.id}
                          className="sr-only"
                          checked={selectedAddressId === address.id}
                          onChange={() => setValue('addressId', address.id)}
                        />
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 rtl:space-x-reverse">
                            <FiMapPin className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                                <h3 className="font-medium text-neutral-800">{address.title}</h3>
                                {address.isDefault && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                    {isArabic ? 'افتراضي' : 'Default'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600">{address.address}</p>
                              <p className="text-xs text-neutral-500">{address.city}, {address.governorate}</p>
                            </div>
                          </div>
                          {selectedAddressId === address.id && (
                            <FiCheck className="h-5 w-5 text-primary-500" />
                          )}
                        </div>
                      </label>
                    ))}

                    {/* Add New Address Button */}
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(true)}
                      className="w-full p-4 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-neutral-400 hover:text-neutral-700 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
                    >
                      <FiPlus className="h-5 w-5" />
                      <span>{isArabic ? 'إضافة عنوان جديد' : 'Add New Address'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiMapPin className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 mb-4">
                      {isArabic ? 'لا توجد عناوين محفوظة' : 'No saved addresses'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(true)}
                      className="btn btn-primary"
                    >
                      {isArabic ? 'إضافة عنوان' : 'Add Address'}
                    </button>
                  </div>
                )}

                {errors.addressId && (
                  <p className="text-red-500 text-sm mt-2">{errors.addressId.message}</p>
                )}
                
                {selectedAddressId && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-800 text-sm font-medium">
                        {isArabic ? 'تم اختيار العنوان بنجاح' : 'Address selected successfully'}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Step 2: Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {step > 2 ? <FiCheck className="h-4 w-4" /> : '2'}
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-800">
                    {isArabic ? 'طريقة الدفع' : 'Payment Method'}
                  </h2>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      value: PaymentMethod.CASH,
                      icon: FiCircle,
                      title: isArabic ? 'دفع نقدي عند التسليم' : 'Cash on Delivery',
                      description: isArabic ? 'ادفع نقداً عند استلام الطلب' : 'Pay with cash when you receive your order',
                    },
                    {
                      value: PaymentMethod.CARD,
                      icon: FiLock ,
                      title: isArabic ? 'بطاقة ائتمان' : 'Credit Card',
                      description: isArabic ? 'ادفع بأمان باستخدام بطاقتك الائتمانية' : 'Pay securely with your credit card',
                    },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPaymentMethod === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value={method.value}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <method.icon className="h-6 w-6 text-neutral-500" />
                          <div>
                            <h3 className="font-medium text-neutral-800">{method.title}</h3>
                            <p className="text-sm text-neutral-600">{method.description}</p>
                          </div>
                        </div>
                        {selectedPaymentMethod === method.value && (
                          <FiCheck className="h-5 w-5 text-primary-500" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {errors.paymentMethod && (
                  <p className="text-red-500 text-sm mt-2">{errors.paymentMethod.message}</p>
                )}
              </motion.div>

              {/* Step 3: Order Notes & Coupon */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    3
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-800">
                    {isArabic ? 'تفاصيل إضافية' : 'Additional Details'}
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Order Notes */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {isArabic ? 'ملاحظات للطلب (اختيارية)' : 'Order Notes (Optional)'}
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      placeholder={isArabic ? 'أي طلبات أو ملاحظات خاصة...' : 'Any special requests or notes...'}
                      className="input w-full resize-none"
                    />
                    {errors.notes && (
                      <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
                    )}
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {isArabic ? 'كود الخصم (اختياري)' : 'Coupon Code (Optional)'}
                    </label>
                    <div className="relative">
                      <input
                        {...register('couponCode')}
                        type="text"
                        placeholder={isArabic ? 'أدخل كود الخصم' : 'Enter coupon code'}
                        className={`input w-full ${couponError ? 'border-red-500' : couponSuccess ? 'border-green-500' : ''}`}
                        style={{ textTransform: 'uppercase' }}
                      />
                      {isValidatingCoupon && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Coupon validation feedback */}
                    {couponError && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <FiX className="h-4 w-4 mr-1" />
                        {couponError}
                      </p>
                    )}
                    
                    {couponSuccess && (
                      <p className="text-green-500 text-sm mt-1 flex items-center">
                        <FiCheck className="h-4 w-4 mr-1" />
                        {couponSuccess}
                      </p>
                    )}
                    
                    {errors.couponCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.couponCode.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-neutral-800 mb-6">
                  {isArabic ? 'ملخص الطلب' : 'Order Summary'}
                </h3>

                {/* Restaurant Info */}
                {cart.restaurant && (
                  <div className="mb-6 pb-6 border-b border-neutral-200">
                    <h4 className="font-medium text-neutral-800 mb-1">
                      {isArabic ? cart.restaurant.nameAr : cart.restaurant.name}
                    </h4>
                    <p className="text-sm text-neutral-500">
                      {isArabic ? 'وقت التوصيل:' : 'Delivery time:'} {cart.restaurant.deliveryTime} {isArabic ? 'دقيقة' : 'min'}
                    </p>
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="w-6 h-6 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-xs font-medium">
                          {item.quantity}
                        </span>
                        <span className="text-sm text-neutral-800">
                          {isArabic ? item.menuItem.nameAr : item.menuItem.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {((item.menuItem.discountPrice || item.menuItem.price) * item.quantity).toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                    <span>{cart.subtotal.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">{isArabic ? 'رسوم التوصيل:' : 'Delivery fee:'}</span>
                    <span>
                      {cart.deliveryFee === 0 
                        ? (isArabic ? 'مجاني' : 'Free')
                        : `${cart.deliveryFee.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}`
                      }
                    </span>
                  </div>

                  {cart.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">{isArabic ? 'الضرائب:' : 'Tax:'}</span>
                      <span>{cart.tax.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
                    </div>
                  )}

                  {cart.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{isArabic ? 'الخصم:' : 'Discount:'}</span>
                      <span>-{cart.discount.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
                    </div>
                  )}
                  
                  {appliedDiscount > 0 && appliedDiscount !== cart.discount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{isArabic ? 'خصم إضافي:' : 'Additional Discount:'}</span>
                      <span>-{appliedDiscount.toFixed(2)} {isArabic ? 'ج.م' : 'EGP'}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-semibold mb-6">
                  <span>{isArabic ? 'المجموع:' : 'Total:'}</span>
                  <span>
                    {appliedDiscount > 0 && appliedDiscount !== cart.discount ? 
                      (cart.total - appliedDiscount).toFixed(2) : 
                      cart.total.toFixed(2)
                    } {isArabic ? 'ج.م' : 'EGP'}
                  </span>
                </div>

                {/* Selected Address Summary */}
                {selectedAddress && (
                  <div className="mb-6 p-3 bg-neutral-50 rounded-lg">
                    <h5 className="text-sm font-medium text-neutral-800 mb-1">
                      {isArabic ? 'عنوان التوصيل:' : 'Delivery to:'}
                    </h5>
                    <p className="text-sm text-neutral-600">{selectedAddress.title}</p>
                    <p className="text-xs text-neutral-500">{selectedAddress.address}</p>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={orderCreating || !selectedAddressId || addresses.length === 0}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {orderCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isArabic ? 'جاري إنشاء الطلب...' : 'Placing order...'}</span>
                    </>
                  ) : (
                    <>
                      <FiShoppingBag className="h-5 w-5" />
                      <span>{isArabic ? 'تأكيد الطلب' : 'Place Order'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;