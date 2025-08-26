import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RazorpayService } from '../services/razorpayService';

interface CustomPaymentProps {}

interface PaymentData {
  amount: number;
  paymentType: string;
  studentData: {
    _id: string;
    regdNo: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone?: string;
  };
}

const CustomPayment: React.FC<CustomPaymentProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, paymentType, studentData } = location.state as PaymentData || {};
  
  const [step, setStep] = useState<'details' | 'processing'>('details');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  // Initialize RazorpayService
  const razorpayService = RazorpayService.getInstance();

  // Function to get student name safely
  const getStudentName = () => {
    if (studentData.firstName && studentData.lastName) {
      return `${studentData.firstName} ${studentData.lastName}`;
    }
    if (studentData.name) {
      return studentData.name;
    }
    if (studentData.firstName) {
      return studentData.firstName;
    }
    return 'Student';
  };

  useEffect(() => {
    if (!amount || !paymentType || !studentData) {
      navigate('/student-dashboard');
      return;
    }

    // Debug: Log the student data structure
    console.log('CustomPayment - Student data received:', studentData);

    // Pre-load Razorpay script
    razorpayService.loadRazorpayScript().then((loaded) => {
      if (!loaded) {
        setError('Failed to load payment gateway. Please check your internet connection and try again.');
      }
    });
  }, [amount, paymentType, studentData, navigate]);

  const handleCancel = () => {
    // Navigate back to dashboard with failed status
    navigate(`/student-dashboard/${studentData?.regdNo}`, {
      state: { 
        paymentStatus: 'failed',
        message: 'Payment cancelled by user'
      }
    });
  };

  const handleProceedToPayment = async () => {
    setLoading(true);
    setStep('processing');
    setError(null);

    try {
      await razorpayService.processPayment(
        {
          amount,
          paymentType,
          studentId: studentData._id
        },
        (details) => {
          setPaymentDetails(details);
          setShowSuccessModal(true);
        },
        (errorMessage) => {
          console.error('Payment error:', errorMessage);
          setError(errorMessage || 'Payment failed. Please try again.');
          setStep('details');
        },
        () => {
          // onDismiss callback
          setError('Payment was cancelled');
          setStep('details');
        }
      );

      console.log('Payment processing completed');
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    navigate(`/student-dashboard/${studentData?.regdNo}`, {
      state: { 
        paymentStatus: 'success',
        message: `Payment of ₹${amount} for ${paymentType} completed successfully`,
        paymentDetails
      }
    });
  };

  if (!amount || !paymentType || !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Payment Request</h2>
          <p className="text-gray-600 mb-4">Missing payment information</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Student: {getStudentName()} ({studentData.regdNo})
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'details' || step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`h-1 w-20 ${
              step === 'processing' ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '2'
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Payment Details</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Payment Type:</span>
                      <span className="font-semibold text-gray-900">{paymentType}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900 text-lg">₹{amount}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Student Name:</span>
                      <span className="font-semibold text-gray-900">
                        {getStudentName()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Registration Number:</span>
                      <span className="font-semibold text-gray-900">{studentData.regdNo}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-900">{studentData.email}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex space-x-4">
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Proceed to Payment</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mb-6">
                  <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Payment
                </h3>
                <p className="text-gray-600 mb-4">
                  Please complete the payment in the Razorpay window
                </p>
                <p className="text-sm text-gray-500">
                  Do not close this window or refresh the page
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600">
                  Your payment of ₹{amount} for {paymentType} has been processed successfully.
                </p>
              </div>

              {paymentDetails && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Details:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {paymentDetails.receiptNumber && (
                      <div>Receipt: {paymentDetails.receiptNumber}</div>
                    )}
                    {paymentDetails.transactionId && (
                      <div>Transaction ID: {paymentDetails.transactionId}</div>
                    )}
                    {paymentDetails.paidDate && (
                      <div>Date: {new Date(paymentDetails.paidDate).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSuccessClose}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomPayment;
