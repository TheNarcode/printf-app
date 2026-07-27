import { useCallback, useState } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '@env';
import { useAuth } from '../context/AuthContext';
import { usePrintJob } from '../context/PrintJobContext';
import { CustomAlertAPI } from '../components/CustomAlert';
import { getPaymentErrorReason } from '../utils/razorpay';
import type { Order } from '../types';

export function usePayOrder() {
  const { user } = useAuth();
  const { refreshOrders } = usePrintJob();
  const [isPaying, setIsPaying] = useState(false);

  const payOrder = useCallback(
    async (order: Order, onSuccess?: () => void) => {
      if (!order.paymentRequestId) return;
      setIsPaying(true);

      const amount = Math.round((order.totalPrice + order.convenienceFee) * 100);

      const options = {
        description: `Payment for Print Order ${order.orderRef}`,
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: amount.toString(),
        name: 'printf',
        order_id: order.paymentRequestId,
        prefill: {
          email: user?.email || '',
          name: user?.name || '',
        },
        theme: { color: '#18181B' },
      };

      try {
        await RazorpayCheckout.open(options);

        refreshOrders().catch(() => {});
        if (onSuccess) onSuccess();

        CustomAlertAPI.alert(
          'Payment Successful',
          'Your order is now confirmed and will be processed shortly.',
        );
      } catch (err: unknown) {
        const reason = getPaymentErrorReason(err);
        if (reason === 'cancelled') {
          CustomAlertAPI.alert(
            'Payment Cancelled',
            'The payment was cancelled. The order is still pending — you can pay anytime here.',
          );
        } else if (reason === 'timeout') {
          CustomAlertAPI.alert(
            'Connection Timeout',
            'Request timed out. Please check your connection and try again.',
          );
        } else if (reason === 'session') {
          CustomAlertAPI.alert(
            'Session Expired',
            'Your session has expired. Please sign in again to continue.',
          );
        } else {
          CustomAlertAPI.alert(
            'Payment Failed',
            'Your payment could not be processed. Please try again with a different payment method.',
          );
        }
      } finally {
        setIsPaying(false);
      }
    },
    [user, refreshOrders],
  );

  return { payOrder, isPaying };
}