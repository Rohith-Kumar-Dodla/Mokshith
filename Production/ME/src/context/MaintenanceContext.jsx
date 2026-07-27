import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getFriendlyMaintenanceMessage } from '../utils/loginErrorMapper';

const MaintenanceContext = createContext({
  maintenanceMode: false,
  maintenanceMessage: '',
  loading: true,
  refreshMaintenanceStatus: async () => {},
});

function unwrapPayload(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export function MaintenanceProvider({ children }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshMaintenanceStatus = useCallback(async () => {
    try {
      const response = await api.get('/settings/public/config');
      const payload = unwrapPayload(response);
      setMaintenanceMode(Boolean(payload?.maintenanceMode));
      setMaintenanceMessage(
        getFriendlyMaintenanceMessage(payload?.maintenanceMessage)
      );
    } catch {
      setMaintenanceMode(false);
      setMaintenanceMessage('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMaintenanceStatus();
  }, [refreshMaintenanceStatus]);

  const value = useMemo(
    () => ({
      maintenanceMode,
      maintenanceMessage,
      loading,
      refreshMaintenanceStatus,
    }),
    [maintenanceMode, maintenanceMessage, loading, refreshMaintenanceStatus]
  );

  return (
    <MaintenanceContext.Provider value={value}>{children}</MaintenanceContext.Provider>
  );
}

export function useMaintenanceMode() {
  return useContext(MaintenanceContext);
}

export default MaintenanceProvider;
