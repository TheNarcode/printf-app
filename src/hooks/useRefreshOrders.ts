import { useCallback, useState } from 'react';
import { usePrintJob } from '../context/PrintJobContext';
import { useNetwork } from '../context/NetworkContext';

export function useRefreshOrders() {
  const { refreshOrders } = usePrintJob();
  const { assertOnline } = useNetwork();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!assertOnline()) return;
    setIsRefreshing(true);
    try {
      await refreshOrders();
    } catch (err) {
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshOrders, assertOnline]);

  return { isRefreshing, handleRefresh };
}