import { useState, useEffect, useCallback } from 'react';
import { monitoringService } from '../services/monitoringService.js';

export const useMonitoring = () => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, metricsData, businessData] = await Promise.all([
        monitoringService.getHealth(),
        monitoringService.getMetrics(),
        monitoringService.getBusinessMetrics(),
      ]);
      setHealth(healthData);
      setMetrics(metricsData);
      setBusinessMetrics(businessData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { health, metrics, businessMetrics, loading, error, refetch: fetchAll };
};
