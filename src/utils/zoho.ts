/**
 * Maps Zoho Payments SDK error codes to the app's internal payment failure reasons.
 *
 * Zoho throws an object with { code: string, message: string } on failure.
 * Docs: https://www.zoho.com/in/payments/developerdocs/mobile-errors/
 */
export function getPaymentErrorReason(err: unknown): string {
  const code = (err as any)?.code ?? '';
  const message = String((err as any)?.message ?? '').toLowerCase();

  switch (code) {
    // User deliberately closed the checkout widget
    case 'widget_closed':
      return 'cancelled';

    // Session timed out or widget couldn't load (network/infra issue)
    case 'session_expired':
    case 'widget_failed_to_load':
      return 'timeout';

    // Bad API key / Account ID — our credentials are wrong
    case 'authorization_error':
      return 'session';

    // Everything else — processor error, validation, missing params, payment method validation etc.
    case 'processor_error':
    case 'widget_validation_error':
    case 'inadequate_params_to_load_widget':
    case 'paymentmethods_validation':
      return 'payment_failed';
  }

  // Fallback: try reading the message string for anything unrecognised
  if (message.includes('cancel') || message.includes('dismiss')) return 'cancelled';
  if (message.includes('authentication required')) return 'session';
  if (message.includes('timed out') || message.includes('network')) return 'timeout';

  return 'payment_failed';
}
