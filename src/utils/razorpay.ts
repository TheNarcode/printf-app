export function getPaymentErrorReason(err: unknown): string {
  const msg = (err as any)?.message || (err as any)?.description || '';
  const code = (err as any)?.code;
  const lowerMsg = String(msg).toLowerCase();

  if (
    code === 0 ||
    code === 2 ||
    lowerMsg.includes('cancel') ||
    lowerMsg.includes('dismiss')
  ) {
    return 'cancelled';
  }
  if (
    lowerMsg.includes('unable to connect') ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('network')
  ) {
    return 'timeout';
  }
  if (lowerMsg.includes('authentication required')) {
    return 'session';
  }
  if (lowerMsg.includes('failed') || lowerMsg.includes('declined')) {
    return 'payment_failed';
  }
  return 'unknown';
}