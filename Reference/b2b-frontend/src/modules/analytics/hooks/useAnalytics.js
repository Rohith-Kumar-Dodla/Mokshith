import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService.js';

export const useAnalytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [orderTrends, setOrderTrends] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsService.getDashboard();
      const data = response?.data?.data || response?.data || response;
      
      // Ensure numeric values and correct property mapping (backend uses 'dashboard')
      const dashboardData = data.dashboard || data.stats || {};
      
      const sanitizedStats = {
        revenue: Number(dashboardData.revenue || 0),
        totalOrders: Number(dashboardData.totalOrders || 0),
        activeUsers: Number(dashboardData.activeCustomers || dashboardData.activeUsers || 0),
        pendingDeliveries: Number(dashboardData.pendingDeliveries || 0),
        revenueGrowth: Number(dashboardData.revenueGrowth || 0),
        ordersGrowth: Number(dashboardData.ordersGrowth || 0)
      };
      
      setDashboard(sanitizedStats);
      setSalesData(data.salesData || data.salesTrends || []);
      setOrderTrends(data.orderTrends || data.categoryMix || []);
      setTopProducts(data.topProducts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSalesData = useCallback(async () => {
    // Already handled by fetchDashboard, but keep for compatibility
    await fetchDashboard();
  }, [fetchDashboard]);

  const fetchOrderTrends = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  const fetchCategoryDistribution = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  const fetchTopProducts = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    salesData,
    orderTrends,
    categoryData,
    topProducts,
    loading,
    error,
    fetchDashboard,
    fetchSalesData,
    fetchOrderTrends,
    fetchCategoryDistribution,
    fetchTopProducts
  };
};