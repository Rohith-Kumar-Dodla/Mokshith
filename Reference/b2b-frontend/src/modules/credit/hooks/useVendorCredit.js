import { useState, useEffect, useCallback } from 'react';
import { creditService } from '../services/creditService.js';

export const useVendorCredit = () => {
  const [account, setAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creditService.getVendorCreditDashboard();
      setAccount(data.account);
      setLedger(data.ledger || []);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { account, ledger, summary, loading, error, refetch: fetchDashboard };
};
