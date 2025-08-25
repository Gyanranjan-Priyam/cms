import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface CustomPaymentProps {}

const CustomPayment: React.FC<CustomPaymentProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, paymentType, studentData } = location.state || {};
  
  const [step, setStep] = useState<'details' | 'qr' | 'transaction'>('details');
  const [transactionId, setTransactionId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // UPI ID for payments
  const UPI_ID = "college@paytm"; // Replace with your actual UPI ID

  useEffect(() => {
    if (!amount || !paymentType || !studentData) {
      navigate('/student-dashboard');
    }
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

  const handleProceedToQR = () => {
    setStep('qr');
  };

  const handleProceedToTransaction = () => {
    setStep('transaction');
  };

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim()) {
      alert('Please enter your transaction ID');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/payments/custom-payment',
        {
          amount,
          paymentType,
          paymentMethod: 'custom_qr', // Valid enum value from Payment model
          transactionId: transactionId.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error submitting payment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate(`/student-dashboard/${studentData?.regdNo}`, {
      state: { 
        paymentStatus: 'pending',
        message: 'Payment submitted for verification'
      }
    });
  };

  const generateQRCode = () => {
    // Generate QR code URL with amount-specific UPI link
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=College Management System&am=${amount}&cu=INR&tn=Payment for ${paymentType} - ${studentData?.regdNo}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => step === 'details' ? navigate(-1) : setStep(step === 'qr' ? 'details' : 'qr')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Payment Gateway</h1>
            <div className="w-16" /> {/* Spacer */}
          </div>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-4">
              {['details', 'qr', 'transaction'].map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === stepName 
                      ? 'bg-blue-600 text-white' 
                      : ['details', 'qr', 'transaction'].indexOf(step) > index
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                  }`}>
                    {['details', 'qr', 'transaction'].indexOf(step) > index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 2 && (
                    <div className={`w-12 h-1 ${
                      ['details', 'qr', 'transaction'].indexOf(step) > index 
                        ? 'bg-green-600' 
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Details</span>
              <span>QR Code</span>
              <span>Transaction ID</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Payment Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>
              
              <div className="space-y-6">
                {/* Student Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Student Name</label>
                      <div className="text-lg font-semibold text-gray-900">
                        {studentData?.firstName} {studentData?.lastName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Registration Number</label>
                      <div className="text-lg font-semibold text-gray-900">{studentData?.regdNo}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <div className="text-lg font-semibold text-gray-900">{studentData?.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Payment Type</label>
                      <div className="text-lg font-semibold text-gray-900 capitalize">{paymentType}</div>
                    </div>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Amount</h3>
                  <div className="text-4xl font-bold text-green-600">₹{amount}</div>
                  <div className="text-sm text-gray-600 mt-2">Amount to be paid for {paymentType} fees</div>
                </div>

                {/* Important Information */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Important:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Please ensure you have sufficient balance in your UPI account</li>
                        <li>Your payment will be verified by the finance department</li>
                        <li>Keep your transaction ID safe for reference</li>
                        <li>Payment status will be updated within 24 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToQR}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: QR Code Payment */}
          {step === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Scan QR Code for Payment</h2>
              
              <div className="space-y-6">
                {/* QR Code */}
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <div className="mb-4">
                    <img 
                      src={generateQRCode()} 
                      alt="Payment QR Code" 
                      className="mx-auto w-64 h-64 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    Scan with any UPI App
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-2">₹{amount}</div>
                  <div className="text-sm text-gray-600">
                    UPI ID: {UPI_ID}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h3>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Open any UPI app (PhonePe, Google Pay, Paytm, etc.)</li>
                    <li>Scan the QR code above</li>
                    <li>Verify the amount (₹{amount}) and UPI ID</li>
                    <li>Complete the payment</li>
                    <li>Note down your transaction ID</li>
                    <li>Click "Continue" to enter transaction details</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToTransaction}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Continue to Next Step
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Transaction ID Input */}
          {step === 'transaction' && (
            <motion.div
              key="transaction"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Enter Transaction Details</h2>
              
              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="text-2xl font-bold text-green-600">₹{amount}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Payment Type:</span>
                    <span className="font-semibold capitalize">{paymentType}</span>
                  </div>
                </div>

                {/* Transaction ID Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID / Reference Number *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter the transaction ID from your UPI app"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    💡 Find this in your UPI app under transaction history
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Important:</strong> Make sure you have completed the payment before submitting the transaction ID. 
                      Your payment will be verified by our finance team within 24 hours.
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitTransaction}
                  disabled={!transactionId.trim() || loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Submit Payment
                    </>
                  )}
                </button>
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
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Submitted Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Your payment has been submitted for verification. You'll receive confirmation within 24 hours. 
                  The payment status will be updated after verification by our finance team.
                </p>
                <button
                  onClick={handleModalClose}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomPayment;
