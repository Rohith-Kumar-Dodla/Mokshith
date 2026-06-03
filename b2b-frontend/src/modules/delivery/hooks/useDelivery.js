import { useState, useEffect, useCallback } from "react";
import { deliveryService } from "../services/deliveryService";
import { useSocket } from "../../../context/SocketContext";

export const useDelivery = () => {
  const { socket, isConnected } = useSocket();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const [assignments, queue, history] = await Promise.all([
        deliveryService.getDeliveries(),
        deliveryService.getDeliveryQueue(),
        deliveryService.getDeliveryHistory()
      ]);
      setDeliveries({
        assigned: Array.isArray(assignments) ? assignments : [],
        available: Array.isArray(queue) ? queue : [],
        completed: Array.isArray(history) ? history : []
      });
    } catch (err) {
      console.error(err);
      setDeliveries({ assigned: [], available: [], completed: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptDelivery = async (id) => {
    try {
      await deliveryService.acceptDelivery(id);
      await fetchDeliveries();
    } catch (err) {
      console.error("Accept delivery failed", err);
    }
  };

  const startDelivery = async (id) => {
    try {
      await deliveryService.startDelivery(id);
      await fetchDeliveries();
    } catch (err) {
      console.error("Start delivery failed", err);
    }
  };

  const markAsDelivered = async (id) => {
    try {
      await deliveryService.markAsDelivered(id);
      await fetchDeliveries();
    } catch (err) {
      console.error("Mark as delivered failed", err);
    }
  };

  const updateDeliveryStatus = async (id, status) => {
    try {
      await deliveryService.updateStatus(id, status);
      setDeliveries((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((d) => (d._id === id ? { ...d, status } : d));
      });
    } catch (err) {
      console.error("Update status failed", err);
    }
  };

  useEffect(() => {
    fetchDeliveries();

    if (!socket) return;

    const onStatusUpdated = (updatedShipment) => {
      setDeliveries((prev) => {
        if (!Array.isArray(prev)) return [updatedShipment];
        return prev.map((d) => d._id === updatedShipment._id ? updatedShipment : d);
      });
    };

    const onLocationUpdated = ({ id, location }) => {
      setDeliveries((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((d) => d._id === id ? { ...d, currentLocation: location } : d);
      });
    };

    socket.on('delivery:statusUpdated', onStatusUpdated);
    socket.on('delivery:locationUpdated', onLocationUpdated);

    return () => {
      socket.off('delivery:statusUpdated', onStatusUpdated);
      socket.off('delivery:locationUpdated', onLocationUpdated);
    };
  }, [fetchDeliveries, socket]);

  return { 
    deliveries, 
    loading, 
    error, 
    updateDeliveryStatus, 
    fetchDeliveries,
    acceptDelivery,
    startDelivery,
    markAsDelivered
  };
};