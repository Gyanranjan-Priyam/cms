// Razorpay Payment Gateway Service
import axios from 'axios';
import { getApiUrl } from '../config/api';

export interface RazorpayConfig {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentOrderRequest {
  amount: number;
  paymentType: string;
  studentId?: string;
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  paymentType: string;
  amount: number;
}

export class RazorpayService {
  private static instance: RazorpayService;
  private razorpayLoaded = false;

  private constructor() {}

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Load Razorpay script dynamically
   */
  public async loadRazorpayScript(): Promise<boolean> {
    if (this.razorpayLoaded) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.razorpayLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Create payment order on backend
   */
  public async createOrder(orderData: PaymentOrderRequest): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl('api/razorpay/create-order'),
        {
          amount: Math.round(orderData.amount * 100), // Convert to paise
          paymentType: orderData.paymentType,
          studentId: orderData.studentId
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create payment order'
      );
    }
  }

  /**
   * Verify payment on backend
   */
  public async verifyPayment(verificationData: PaymentVerificationRequest): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl('api/razorpay/verify-payment'),
        verificationData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Payment verification failed'
      );
    }
  }

  /**
   * Initialize Razorpay payment
   */
  public async initiatePayment(config: RazorpayConfig): Promise<void> {
    if (!this.razorpayLoaded) {
      throw new Error('Razorpay script not loaded');
    }

    if (!window.Razorpay) {
      throw new Error('Razorpay not available');
    }

    const razorpay = new window.Razorpay(config);
    razorpay.open();
  }

  /**
   * Complete payment flow
   */
  public async processPayment(
    orderData: PaymentOrderRequest,
    onSuccess: (paymentData: any) => void,
    onError: (error: string) => void,
    onDismiss?: () => void
  ): Promise<void> {
    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Step 2: Create order
      const orderResponse = await this.createOrder(orderData);
      const { order_id, amount, currency } = orderResponse;

      // Step 3: Configure Razorpay
      // Validate environment variable
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay key not configured. Please set VITE_RAZORPAY_KEY_ID in environment variables.');
      }

      const config: RazorpayConfig = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'College Management System',
        description: `Payment for ${orderData.paymentType} fees`,
        order_id,
        prefill: {
          name: orderResponse.student_name || 'Student',
          email: orderResponse.student_email || '',
          contact: orderResponse.student_phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Step 4: Verify payment
            const verificationResult = await this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentType: orderData.paymentType,
              amount: orderData.amount
            });

            onSuccess(verificationResult);
          } catch (error: any) {
            onError(error.message);
          }
        },
        modal: {
          ondismiss: () => {
            if (onDismiss) onDismiss();
          }
        }
      };

      // Step 5: Initiate payment
      await this.initiatePayment(config);

    } catch (error: any) {
      onError(error.message);
    }
  }
}

// Export singleton instance
export const razorpayService = RazorpayService.getInstance();

// Declare Razorpay for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}
