import {useState, useCallback} from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '@env';
import {useAuth} from '../context/AuthContext';
import {usePrintJob} from '../context/PrintJobContext';
import {CustomAlertAPI} from '../components/CustomAlert';
import type {Order} from '../types';

export function usePayOrder() {
  const {user} = useAuth();
  const {refreshOrders} = usePrintJob();
  const [isPaying, setIsPaying] = useState(false);

  const payOrder = useCallback(async (order: Order, onSuccess?: () => void) => {
    if (!order.paymentRequestId) return;
    setIsPaying(true);

    const amount = Math.round((order.totalPrice + order.convenienceFee) * 100);

    const options = {
      description: `Payment for Print Order ${order.orderRef}`,
      image: '',
      currency: 'INR',
      key: RAZORPAY_KEY_ID, // Live key
      amount: amount.toString(),
      name: 'printf',
      order_id: order.paymentRequestId,
      prefill: {
        email: user?.email || '',
        name: user?.name || '',
      },
      theme: {color: '#53a20e'}
    };

    try {
      await RazorpayCheckout.open(options);
      
      // Payment successful
      refreshOrders().catch(() => {});
      if (onSuccess) onSuccess();
      
      CustomAlertAPI.alert('Payment Successful', 'Your order is now confirmed and will be processed shortly.');
    } catch (error: any) {
      const msg = error?.description || error?.message || '';
      const code = error?.code;

      if (code === 0 || code === 2 || msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('dismiss')) {
        // User dismissed — show a gentle nudge
        CustomAlertAPI.alert('Payment Cancelled', 'The payment was cancelled. The order is still pending — you can pay anytime here.');
      } else {
        CustomAlertAPI.alert('Payment Failed', msg || 'Your payment could not be processed. Please try again with a different payment method.');
      }
    } finally {
      setIsPaying(false);
    }
  }, [user, refreshOrders]);

  return {payOrder, isPaying};
}
