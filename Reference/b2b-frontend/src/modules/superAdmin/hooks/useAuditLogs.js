import { useState, useEffect, useCallback } from 'react';
import { auditService } from '../services/auditService.js';

export const useAuditLogs = (initialFilters = {}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (activeFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getAuditLogs(activeFilters);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = (newFilters) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    fetchLogs(merged);
  };

  const exportLogs = async () => {
    return auditService.exportAuditLogs(filters);
  };

  const viewLogDetail = async (id) => {
    try {
      const log = await auditService.getAuditLogById(id);
      setSelectedLog(log);
      return log;
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    error,
    filters,
    selectedLog,
    setSelectedLog,
    updateFilters,
    exportLogs,
    viewLogDetail,
    refetch: fetchLogs,
  };
};
