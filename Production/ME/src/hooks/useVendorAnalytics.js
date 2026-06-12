import { useMemo } from 'react';
import useOrders from './useOrders';
import useCredit from './useCredit';
import { computeVendorAnalytics } from '../utils/vendorAnalytics';

export function useVendorAnalytics() {
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { credit, loading: creditLoading, error: creditError } = useCredit();

  const analytics = useMemo(
    () => computeVendorAnalytics(orders, credit),
    [orders, credit]
  );

  return {
    analytics,
    loading: ordersLoading || creditLoading,
    error: ordersError || creditError,
    orders,
  };
}

export default useVendorAnalytics;
