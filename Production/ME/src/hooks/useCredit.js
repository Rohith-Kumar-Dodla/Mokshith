import { useCallback, useEffect, useState } from 'react';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import creditService from '../services/creditService';


function unwrapCredit(payload) {
  const data = payload?.data ?? payload;
  return {
    creditLimit: Number(data?.creditLimit ?? 0),
    usedCredit: Number(data?.usedCredit ?? 0),
    availableCredit: Number(data?.availableCredit ?? 0),
    status: data?.status || 'ACTIVE',
    raw: data,
  };
}

export function useCredit({ autoLoad = true } = {}) {
  const [credit, setCredit] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [error, setError] = useState(null);

  const refreshCredit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await creditService.getCredit();
      setCredit(unwrapCredit(payload));
    } catch (loadError) {
      setError(getUserFacingErrorMessage(loadError, 'Failed to load credit account'));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLedger = useCallback(async () => {
    try {
      const payload = await creditService.getLedger();
      const list = payload?.data ?? payload;
      setLedger(Array.isArray(list) ? list : []);
    } catch {
      setLedger([]);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      refreshCredit();
      refreshLedger();
    }
  }, [autoLoad, refreshCredit, refreshLedger]);

  const validateAmount = useCallback(
    (amount) => {
      if (!credit) return 'Credit account unavailable';
      if (credit.status === 'BLOCKED') return 'Credit account is blocked';
      if (Number(amount) > credit.availableCredit) {
        return `Insufficient credit. Available: ₹${credit.availableCredit.toLocaleString('en-IN')}`;
      }
      return '';
    },
    [credit]
  );

  return {
    credit,
    ledger,
    loading,
    error,
    refreshCredit,
    refreshLedger,
    validateAmount,
  };
}

export default useCredit;
