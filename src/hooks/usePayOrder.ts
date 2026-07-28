import { useCallback, useState } from 'react';
import { showCheckout } from 'zoho-payments-react-native-sdk';
import type { ShowCheckoutOptions } from 'zoho-payments-react-native-sdk';
import { useAuth } from '../context/AuthContext';
import { usePrintJob } from '../context/PrintJobContext';
import { CustomAlertAPI } from '../components/CustomAlert';
import { getPaymentErrorReason } from '../utils/zoho';
import type { Order } from '../types';

export function usePayOrder() {
  const { user } = useAuth();
  const { refreshOrders } = usePrintJob();
  const [isPaying, setIsPaying] = useState(false);

  const payOrder = useCallback(
    async (order: Order, onSuccess?: () => void) => {
      if (!order.paymentRequestId) return;
      setIsPaying(true);

      const options: ShowCheckoutOptions = {
        paymentSessionId: order.paymentRequestId,
        description: `Payment for Print Order ${order.orderRef}`,
        name: user?.name || '',
        email: user?.email || '',
        phone: '9876543210'
      };

      try {
        const result = await showCheckout(options);

        if (result?.paymentId) {
          refreshOrders().catch(() => {});
          if (onSuccess) onSuccess();

          CustomAlertAPI.alert(
            'Payment Successful',
            'Your order is now confirmed and will be processed shortly.',
          );
        } else {
          CustomAlertAPI.alert(
            'Payment Failed',
            'Your payment could not be processed. Please try again with a different payment method.',
          );
        }
      } catch (err: unknown) {
        console.error('[Zoho usePayOrder Error]', err);
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