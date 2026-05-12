import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

/**
 * Hook to get system settings and feature flags
 */
export const useSystemConfig = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/public/config');
      // The backend returns an object with key-value pairs
      setConfig(response.data || response || {});
    } catch (err) {
      console.error('Failed to fetch system config:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const isFeatureEnabled = (featureKey) => {
    // Check top-level first (like allowRegistration)
    if (config[featureKey] === false) return false;
    
    // Check inside featureFlags object
    if (config.featureFlags && config.featureFlags[featureKey] === false) {
      return false;
    }
    
    return true;
  };

  const getSetting = (settingKey, defaultValue = null) => {
    return config[settingKey] ?? defaultValue;
  };

  return { config, loading, error, isFeatureEnabled, getSetting, refreshConfig: fetchConfig };
};

export const useFeatureFlags = () => {
  const { config, loading, isFeatureEnabled } = useSystemConfig();
  return { flags: config, loading, isFeatureEnabled };
};

export const useSystemSettings = () => {
  const { config, loading, getSetting } = useSystemConfig();
  return { settings: config, loading, getSetting };
};
