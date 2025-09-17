import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store';
import { selectOrderById } from '../store/slices/orderSlice';
import { selectUser } from '../store/slices/authSlice';
import {
  FiFilter, // Using a more appropriate icon
  FiLock,
  FiCheck,
  FiArrowLeft,
  FiCircle,
  FiClock,
  FiMapPin,
  FiShoppingBag,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Payment form validation schema
const paymentSchema = yup.object({
  cardNumber: yup
    .string()
    .required('Card number is required')
    .matches(/^\d{16}$/, 'Card number must be 16 digits'), // This validation is correct
  expiryMonth: yup
    .string()
    .required('Expiry month is required')
    .matches(/^(0[1-9]|1[0-2])$/, 'Invalid month'),
  expiryYear: yup
    .string()
    .required('Expiry year is required')
    .matches(/^\d{4}$/, 'Invalid year')
    .test('future-date', 'Card has expired', function(value) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const year = parseInt(value);
      const month = parseInt(this.parent.expiryMonth);
      
      if (year < currentYear) return false;
      if (year === currentYear && month < currentMonth) return false;
      return true;
    }),
  cvv: yup
    .string()
    .required('CVV is required')
    .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  cardholderName: yup
    .string()
    .required('Cardholder name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
}) as yup.ObjectSchema<PaymentFormData>;

type PaymentFormData = {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
};

const PaymentPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orderId } = useParams<{ orderId: string }>();
  const order = useAppSelector(state => orderId ? selectOrderById(orderId)(state) : null);
  const user = useAppSelector(selectUser);
  
  const currentLanguage = i18n.language;
  const isArabic = currentLanguage === 'ar';

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');

  const {
    register,
    handleSubmit,
    watch,
    setValue, // FIX: Import setValue from react-hook-form
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
    },
  });

  const cardNumber = watch('cardNumber');

  useEffect(() => {
    if (!orderId || !order) {
      navigate('/orders');
      return;
    }
    if (order.paymentMethod !== 'CARD') {
      navigate(`/order-confirmation/${orderId}`);
      return;
    }
    if (order.paymentStatus === 'COMPLETED') {
      navigate(`/order-confirmation/${orderId}`);
      return;
    }
  }, [orderId, order, navigate]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!order) return;
    setIsProcessing(true);
    setPaymentStep('processing');
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const paymentSuccess = Math.random() > 0.1;
      if (paymentSuccess) {
        setPaymentStep('success');
        toast.success(isArabic ? 'تم الدفع بنجاح!' : 'Payment successful!');
        setTimeout(() => {
          navigate(`/order-confirmation/${orderId}`);
        }, 2000);
      } else {
        setPaymentStep('error');
        toast.error(isArabic ? 'فشل في المعالجة. يرجى المحاولة مرة أخرى.' : 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('error');
      toast.error(isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // FIX: Modify the change handler
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s/g, ''); // Remove spaces for validation
    const formattedValue = rawValue.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '); // Format for display

    // Set the raw value for validation and the formatted value for the input field
    setValue('cardNumber', rawValue, { shouldValidate: true });
    e.target.value = formattedValue;
  };

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-neutral-800">
              {isArabic ? 'الدفع الآمن' : 'Secure Payment'}
            </h1>
            <p className="text-neutral-600 mt-1">
              {isArabic ? 'أكمل عملية الدفع بأمان' : 'Complete your payment securely'}
            </p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="btn btn-outline flex items-center space-x-2 rtl:space-x-reverse"
          >
            <FiArrowLeft className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
            <span>{isArabic ? 'رجوع' : 'Back'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            {paymentStep === 'form' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <FiFilter className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-800">
                    {isArabic ? 'معلومات البطاقة الائتمانية' : 'Credit Card Information'}
                  </h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {isArabic ? 'رقم البطاقة' : 'Card Number'}
                    </label>
                    <div className="relative">
                      <input
                        // FIX: Remove the {...register} here to allow manual control
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        onChange={handleCardNumberChange} // Use the modified handler
                        className="input w-full pl-10"
                      />
                      <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    </div>
                    {errors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardNumber.message}</p>
                    )}
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {isArabic ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                    </label>
                    <input
                      {...register('cardholderName')}
                      type="text"
                      placeholder={isArabic ? 'الاسم كما هو مكتوب على البطاقة' : 'Name as it appears on card'}
                      className="input w-full"
                    />
                    {errors.cardholderName && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardholderName.message}</p>
                    )}
                  </div>

                  {/* Expiry Date and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {isArabic ? 'تاريخ الانتهاء' : 'Expiry Date'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          {...register('expiryMonth')}
                          type="text"
                          placeholder="MM"
                          maxLength={2}
                          className="input w-full"
                        />
                        <input
                          {...register('expiryYear')}
                          type="text"
                          placeholder="YYYY"
                          maxLength={4}
                          className="input w-full"
                        />
                      </div>
                      {(errors.expiryMonth || errors.expiryYear) && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.expiryMonth?.message || errors.expiryYear?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        CVV
                      </label>
                      <input
                        {...register('cvv')}
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        className="input w-full"
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{errors.cvv.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <FiLock className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">
                          {isArabic ? 'دفع آمن' : 'Secure Payment'}
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          {isArabic
                            ? 'معلوماتك محمية بتشفير SSL. لن نحفظ تفاصيل بطاقتك الائتمانية.'
                            : 'Your information is protected with SSL encryption. We do not store your credit card details.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn btn-primary w-full flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiLock className="h-5 w-5" />
                    <span>
                      {isArabic ? 'دفع آمن' : 'Pay Securely'}
                    </span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* Other States (processing, success, error) remain the same... */}
            
          </div>

          {/* Order Summary (remains the same) ... */}

        </div>
      </div>
    </div>
  );
};

export default PaymentPage;