import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import orderService from '../services/orderService';
import { computeOrderStats, mapBackendOrder } from '../utils/orderMapper';
import { patchMappedOrderFromStatusEvent } from '../utils/orderStatusSync';
import useOrderStatusSync from './useOrderStatusSync';

function extractOrdersPayload(response) {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
}

export function useOrders({ autoLoad = true } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await orderService.getAllOrders();
      const mappedOrders = extractOrdersPayload(response)
        .map(mapBackendOrder)
        .filter(Boolean);
      setOrders(mappedOrders);
      return mappedOrders;
    } catch (loadError) {
      setOrders([]);
      setError(getUserFacingErrorMessage(loadError, 'Failed to load orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadOrders();
    }
  }, [autoLoad, loadOrders]);

  useOrderStatusSync((event) => {
    setOrders((current) =>
      current.map((order) => patchMappedOrderFromStatusEvent(order, event))
    );
  });

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  return {
    loading,
    error,
    orders,
    stats,
    loadOrders,
  };
}

export function useOrderDetails(orderId, { autoLoad = true } = {}) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(autoLoad && orderId));
  const [error, setError] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await orderService.getOrderById(orderId);
      const payload = response?.data ?? response;
      const mappedOrder = mapBackendOrder(payload);
      setOrder(mappedOrder);
      return mappedOrder;
    } catch (loadError) {
      setOrder(null);
      setError(getUserFacingErrorMessage(loadError, 'Failed to load order');
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (autoLoad) {
      loadOrder();
    }
  }, [autoLoad, loadOrder]);

  useOrderStatusSync((event) => {
    setOrder((current) => patchMappedOrderFromStatusEvent(current, event));
  });

  return {
    loading,
    error,
    order,
    loadOrder,
  };
}

export default useOrders;
