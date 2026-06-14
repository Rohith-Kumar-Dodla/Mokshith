import { useCallback, useEffect, useMemo, useState } from 'react';
import deliveryService from '../services/deliveryService';
import adminService from '../services/adminService';
import orderService from '../services/orderService';
import {
  mapAdminDeliveryPartners,
  mapAdminDeliveryQueue,
  mapAdminDeliveryHistory,
} from '../utils/adminDeliveryMapper';

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export function useDeliveryAssignment({ autoLoad = true } = {}) {
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [partners, setPartners] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const [queuePayload, historyPayload, partnersPayload, ordersPayload] = await Promise.all([
        deliveryService.getDeliveryQueue(),
        deliveryService.getDeliveryHistory(),
        adminService.getUsers({ role: 'DELIVERY_PARTNER' }),
        orderService.getAllOrders(),
      ]);

      const mappedQueue = mapAdminDeliveryQueue(queuePayload);
      const mappedHistory = mapAdminDeliveryHistory(historyPayload);
      const partnerUsers = partnersPayload?.data ?? partnersPayload;
      const users = Array.isArray(partnerUsers) ? partnerUsers : partnerUsers?.users || [];
      const mappedPartners = mapAdminDeliveryPartners(users, mappedQueue);

      setQueue(mappedQueue);
      setHistory(mappedHistory);
      setPartners(mappedPartners);

      const orderList = ordersPayload?.data ?? ordersPayload;
      const orders = Array.isArray(orderList) ? orderList : orderList?.orders || [];
      const assignedOrderIds = new Set(
        mappedQueue.map((item) => String(item.orderId)).filter(Boolean)
      );

      setPendingOrders(
        orders
          .filter((order) => {
            const status = String(order.status || '').toUpperCase();
            const orderId = String(order._id || order.id);
            return ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED'].includes(status)
              && !assignedOrderIds.has(orderId);
          })
          .map((order) => ({
            id: order._id || order.id,
            orderId: order._id || order.id,
            vendor: order.userId?.name || order.userId?.businessName || 'Vendor',
            area: order.address?.city || order.shippingAddress?.city || '—',
            items: order.items?.length || 0,
            amount: Number(order.totalAmount || 0),
            status: order.status,
            date: order.createdAt,
            needsShipment: true,
          }))
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to load delivery assignment data'));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      refreshAll();
    }
  }, [autoLoad, refreshAll]);

  const unassignedItems = useMemo(() => {
    const fromQueue = queue.filter((item) => !item.deliveryPartnerId);
    return [...pendingOrders, ...fromQueue.filter((item) => !item.needsShipment)];
  }, [queue, pendingOrders]);

  const activeDeliveries = useMemo(
    () => queue.filter((item) => item.deliveryPartnerId && item.status !== 'delivered'),
    [queue]
  );

  const assignPartner = useCallback(
    async (item, partnerId) => {
      setActionLoading(true);
      setError(null);
      try {
        if (item.needsShipment) {
          await deliveryService.createShipment(item.orderId);
          const refreshedQueue = mapAdminDeliveryQueue(await deliveryService.getDeliveryQueue());
          const shipment = refreshedQueue.find(
            (entry) => String(entry.orderId) === String(item.orderId)
          );
          if (shipment?.id) {
            await deliveryService.assignDeliveryPartner(shipment.id, partnerId);
          }
        } else {
          await deliveryService.assignDeliveryPartner(item.id, partnerId);
        }
        await refreshAll({ silent: true });
      } catch (actionError) {
        const message = getErrorMessage(actionError, 'Failed to assign delivery partner');
        setError(message);
        throw new Error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [refreshAll]
  );

  const reassignPartner = useCallback(
    async (shipmentId, partnerId) => {
      setActionLoading(true);
      setError(null);
      try {
        await deliveryService.reassignDeliveryPartner(shipmentId, partnerId);
        await refreshAll({ silent: true });
      } catch (actionError) {
        const message = getErrorMessage(actionError, 'Failed to reassign delivery partner');
        setError(message);
        throw new Error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [refreshAll]
  );

  return {
    unassignedItems,
    activeDeliveries,
    history,
    partners,
    loading,
    actionLoading,
    error,
    refreshAll,
    assignPartner,
    reassignPartner,
  };
}

export default useDeliveryAssignment;
