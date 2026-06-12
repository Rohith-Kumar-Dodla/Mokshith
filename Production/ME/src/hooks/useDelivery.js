import { useCallback, useEffect, useState } from 'react';

import deliveryService from '../services/deliveryService';

import {

  buildEarningsSeries,

  buildPerformanceMetrics,

  computeDeliveryAnalytics,

  mapDeliveryHistory,

  mapNotifications,

  mapShipmentToDeliveryOrder,

  mapShipmentsToDeliveryOrders,

  mapUserToDeliveryProfile,

} from '../utils/deliveryMapper';



const getErrorMessage = (error, fallback) =>

  error?.response?.data?.message || error?.message || fallback;



async function loadSafely(loader, fallback = null) {

  try {

    return await loader();

  } catch {

    return fallback;

  }

}



export function useDelivery({ autoLoad = true } = {}) {

  const [assignments, setAssignments] = useState([]);

  const [history, setHistory] = useState([]);

  const [profile, setProfile] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const [analytics, setAnalytics] = useState(null);

  const [earningsSeries, setEarningsSeries] = useState([]);

  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  const [loading, setLoading] = useState(Boolean(autoLoad));

  const [error, setError] = useState(null);

  const [profileError, setProfileError] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);



  const refreshAll = useCallback(async () => {

    setLoading(true);

    setError(null);

    setProfileError(null);



    try {

      const [

        assignmentsPayload,

        historyPayload,

        profilePayload,

        notificationsPayload,

        analyticsPayload,

      ] = await Promise.all([

        loadSafely(() => deliveryService.getMyAssignments(), { data: [] }),

        loadSafely(() => deliveryService.getDeliveryHistory(), { data: [] }),

        deliveryService.getProfile().catch((profileLoadError) => {

          setProfileError(getErrorMessage(profileLoadError, 'Failed to load profile'));

          return null;

        }),

        loadSafely(() => deliveryService.getNotifications(), { data: [] }),

        loadSafely(() => deliveryService.getDeliveryAnalytics(), null),

      ]);



      const mappedAssignments = mapShipmentsToDeliveryOrders(assignmentsPayload);

      const mappedHistory = mapDeliveryHistory(historyPayload);

      const mappedProfile = profilePayload

        ? mapUserToDeliveryProfile(profilePayload?.data ?? profilePayload)

        : null;

      const mappedNotifications = mapNotifications(notificationsPayload);



      setAssignments(mappedAssignments);

      setHistory(mappedHistory);

      setProfile(mappedProfile);

      setNotifications(mappedNotifications);



      const computedAnalytics = computeDeliveryAnalytics(mappedAssignments, mappedHistory);

      const apiAnalytics = analyticsPayload?.data ?? analyticsPayload;

      if (apiAnalytics && typeof apiAnalytics === 'object') {

        setAnalytics({

          today: {

            assignedOrders: apiAnalytics.activeDeliveries ?? computedAnalytics.today.assignedOrders,

            pendingDeliveries: apiAnalytics.activeDeliveries ?? computedAnalytics.today.pendingDeliveries,

            completedDeliveries: apiAnalytics.completedDeliveries ?? computedAnalytics.today.completedDeliveries,

            todaysEarnings: computedAnalytics.today.todaysEarnings,

            monthlyEarnings: apiAnalytics.earnings ?? computedAnalytics.today.monthlyEarnings,

            averageRating: apiAnalytics.averageRating ?? computedAnalytics.today.averageRating,

            successRate: apiAnalytics.completionRate ?? computedAnalytics.today.successRate,

          },

          activityTimeline: computedAnalytics.activityTimeline,

          backend: apiAnalytics,

        });

      } else {

        setAnalytics(computedAnalytics);

      }

      setEarningsSeries(buildEarningsSeries(mappedHistory));

      setPerformanceMetrics(buildPerformanceMetrics(mappedAssignments, mappedHistory));

    } catch (loadError) {

      setError(getErrorMessage(loadError, 'Failed to load delivery data'));

    } finally {

      setLoading(false);

    }

  }, []);



  const refreshProfile = useCallback(async () => {

    setProfileError(null);

    try {

      const profilePayload = await deliveryService.getProfile();

      const mappedProfile = mapUserToDeliveryProfile(profilePayload?.data ?? profilePayload);

      setProfile(mappedProfile);

      return mappedProfile;

    } catch (profileLoadError) {

      const message = getErrorMessage(profileLoadError, 'Failed to load profile');

      setProfileError(message);

      return null;

    }

  }, []);



  useEffect(() => {

    if (autoLoad) {

      refreshAll();

    }

  }, [autoLoad, refreshAll]);



  const loadShipment = useCallback(async (shipmentId) => {

    setActionLoading(true);

    setError(null);



    try {

      const payload = await deliveryService.getShipmentDetails(shipmentId);

      return mapShipmentToDeliveryOrder(payload?.data ?? payload);

    } catch (loadError) {

      const message = getErrorMessage(loadError, 'Failed to load shipment details');

      setError(message);

      throw new Error(message);

    } finally {

      setActionLoading(false);

    }

  }, []);



  const acceptDelivery = useCallback(

    async (shipmentId) => {

      setActionLoading(true);

      setError(null);

      try {

        await deliveryService.acceptDelivery(shipmentId);

        await refreshAll();

      } catch (actionError) {

        const message = getErrorMessage(actionError, 'Failed to accept delivery');

        setError(message);

        throw new Error(message);

      } finally {

        setActionLoading(false);

      }

    },

    [refreshAll]

  );



  const pickUpDelivery = useCallback(

    async (shipmentId) => {

      setActionLoading(true);

      setError(null);

      try {

        await deliveryService.pickUpDelivery(shipmentId);

        await refreshAll();

      } catch (actionError) {

        const message = getErrorMessage(actionError, 'Failed to mark order as picked up');

        setError(message);

        throw new Error(message);

      } finally {

        setActionLoading(false);

      }

    },

    [refreshAll]

  );



  const startDelivery = useCallback(

    async (shipmentId) => {

      setActionLoading(true);

      setError(null);

      try {

        await deliveryService.startDelivery(shipmentId);

        await refreshAll();

      } catch (actionError) {

        const message = getErrorMessage(actionError, 'Failed to start delivery');

        setError(message);

        throw new Error(message);

      } finally {

        setActionLoading(false);

      }

    },

    [refreshAll]

  );



  const markAsDelivered = useCallback(

    async (shipmentId) => {

      setActionLoading(true);

      setError(null);

      try {

        await deliveryService.markAsDelivered(shipmentId);

        await refreshAll();

      } catch (actionError) {

        const message = getErrorMessage(actionError, 'Failed to mark delivery as completed');

        setError(message);

        throw new Error(message);

      } finally {

        setActionLoading(false);

      }

    },

    [refreshAll]

  );



  const completeDelivery = useCallback(

    async (shipmentId, payload = {}) => {

      setActionLoading(true);

      setError(null);

      try {

        await deliveryService.completeDelivery(shipmentId, payload);

        await refreshAll();

      } catch (actionError) {

        const message = getErrorMessage(actionError, 'Failed to confirm delivery');

        setError(message);

        throw new Error(message);

      } finally {

        setActionLoading(false);

      }

    },

    [refreshAll]

  );



  const updateProfile = useCallback(async (profileData) => {

    setActionLoading(true);

    setProfileError(null);

    try {

      const response = await deliveryService.updateProfile(profileData);

      const mappedProfile = mapUserToDeliveryProfile(response?.data ?? response);

      setProfile(mappedProfile);

      return mappedProfile;

    } catch (actionError) {

      const message = getErrorMessage(actionError, 'Failed to update profile');

      setProfileError(message);

      throw new Error(message);

    } finally {

      setActionLoading(false);

    }

  }, []);



  const markNotificationRead = useCallback(async (notificationId) => {

    await deliveryService.markNotificationRead(notificationId);

    setNotifications((current) =>

      current.map((notification) =>

        notification.id === notificationId ? { ...notification, isRead: true } : notification

      )

    );

  }, []);



  return {

    assignments,

    history,

    profile,

    notifications,

    analytics,

    earningsSeries,

    performanceMetrics,

    loading,

    error,

    profileError,

    actionLoading,

    refreshAll,

    refreshProfile,

    loadShipment,

    acceptDelivery,

    pickUpDelivery,

    startDelivery,

    markAsDelivered,

    completeDelivery,

    updateProfile,

    markNotificationRead,

  };

}



export default useDelivery;

