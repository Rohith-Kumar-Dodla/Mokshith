import { useState, useEffect, useCallback } from 'react';
import { logisticsService } from '../services/logisticsService.js';

export const useAdminLogistics = () => {
  const [queue, setQueue] = useState({ pending: [], assigned: [], all: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await logisticsService.getAdminQueue();
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return { queue, loading, error, refetch: fetchQueue };
};
