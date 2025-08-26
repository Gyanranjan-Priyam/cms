import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Home, Download, Loader2 } from 'lucide-react';

interface PaymentResult {
  success: boolean;
  orderId: string;
  amount: number;
  paymentType: string;
  transactionId?: string;
  studentName?: string;
  receiptNumber?: string;
  paidDate?: string;
  status: string;
}

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const paymentStatus = searchParams.get('status'); // success, failed, pending
    
    if (orderId) {
      verifyPayment(orderId, paymentStatus);
    } else {
      setError('Invalid payment reference');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (orderId: string, status: string | null) => {
    try {
      const token = localStorage.getItem('token');
      
      // First try to get payment details from our database
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/result/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPaymentResult({
          success: response.data.payment.status === 'completed',
          orderId: orderId,
          amount: response.data.payment.amount,
          paymentType: response.data.payment.paymentType,
          transactionId: response.data.payment.transactionId,
          studentName: response.data.payment.student?.firstName + ' ' + response.data.payment.student?.lastName,
          receiptNumber: response.data.payment.receiptNumber,
          paidDate: response.data.payment.paidDate,
          status: response.data.payment.status
        });
      } else {
        // If not found in DB, create a result based on status
        setPaymentResult({
          success: status === 'success',
          orderId: orderId,
          amount: 0,
          paymentType: 'Unknown',
          status: status || 'unknown'
        });
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      setError('Failed to verify payment status');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!paymentResult || !paymentResult.success) return;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .receipt-details {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #2d5a87;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .success-badge {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>College Management System</h1>
          <h2>Payment Receipt</h2>
          <div class="success-badge">✓ PAYMENT SUCCESSFUL</div>
        </div>
        
        <div class="receipt-details">
          <div class="detail-row">
            <strong>Receipt Number:</strong>
            <span>${paymentResult.receiptNumber || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Student Name:</strong>
            <span>${paymentResult.studentName || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Payment Type:</strong>
            <span>${paymentResult.paymentType}</span>
          </div>
          <div class="detail-row">
            <strong>Order ID:</strong>
            <span>${paymentResult.orderId}</span>
          </div>
          <div class="detail-row">
            <strong>Transaction ID:</strong>
            <span>${paymentResult.transactionId || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Payment Date:</strong>
            <span>${paymentResult.paidDate ? new Date(paymentResult.paidDate).toLocaleString() : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Amount Paid:</strong>
            <span class="amount">₹${(paymentResult.amount / 100).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer generated receipt and does not require signature.</p>
          <p>For any queries, please contact the finance department.</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const goToDashboard = () => {
    navigate('/student-dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying payment status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goToDashboard}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to retrieve payment information.</p>
          <button
            onClick={goToDashboard}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`px-8 py-6 text-center ${
            paymentResult.success ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {paymentResult.success ? (
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold">
              {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
            </h1>
            <p className="text-lg mt-2">
              {paymentResult.success 
                ? 'Your payment has been processed successfully.' 
                : 'There was an issue processing your payment.'}
            </p>
          </div>

          {/* Payment Details */}
          <div className="px-8 py-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Transaction Details</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Order ID:</span>
                <span className="text-gray-900 font-mono">{paymentResult.orderId}</span>
              </div>
              
              {paymentResult.transactionId && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Transaction ID:</span>
                  <span className="text-gray-900 font-mono">{paymentResult.transactionId}</span>
                </div>
              )}
              
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Payment Type:</span>
                <span className="text-gray-900 capitalize">{paymentResult.paymentType}</span>
              </div>
              
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{(paymentResult.amount / 100).toFixed(2)}
                </span>
              </div>
              
              {paymentResult.studentName && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Student Name:</span>
                  <span className="text-gray-900">{paymentResult.studentName}</span>
                </div>
              )}
              
              {paymentResult.receiptNumber && (
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Receipt Number:</span>
                  <span className="text-gray-900 font-mono">{paymentResult.receiptNumber}</span>
                </div>
              )}
              
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  paymentResult.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {paymentResult.success ? 'Completed' : 'Failed'}
                </span>
              </div>
              
              {paymentResult.paidDate && (
                <div className="flex justify-between py-3">
                  <span className="font-medium text-gray-700">Payment Date:</span>
                  <span className="text-gray-900">
                    {new Date(paymentResult.paidDate).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 py-6 bg-gray-50 flex flex-col sm:flex-row gap-4">
            <button
              onClick={goToDashboard}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Go to Dashboard
            </button>
            
            {paymentResult.success && (
              <button
                onClick={handlePrintReceipt}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                Print Receipt
              </button>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">What's Next?</h3>
          {paymentResult.success ? (
            <div className="space-y-2 text-gray-600">
              <p>• Your payment has been successfully processed and recorded.</p>
              <p>• You can download your receipt for future reference.</p>
              <p>• Check your dashboard for updated payment status.</p>
              <p>• Contact the finance department if you have any questions.</p>
            </div>
          ) : (
            <div className="space-y-2 text-gray-600">
              <p>• Your payment was not processed successfully.</p>
              <p>• Please try again or contact the finance department.</p>
              <p>• Check your bank account to ensure no amount was debited.</p>
              <p>• If amount was debited, it will be refunded within 5-7 business days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
