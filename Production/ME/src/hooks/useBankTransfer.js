import { useCallback, useEffect, useState } from 'react';
import paymentService from '../services/paymentService';
import { mapPaymentProof } from '../utils/bankTransferUtils';
import { unwrapApiData } from '../utils/apiResponse';

export function useBankTransferDetails() {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await paymentService.getBankTransferDetails();
        const data = unwrapApiData(response);
        if (mounted) setBankDetails(data);
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError?.response?.data?.message ||
            loadError.message ||
            'Failed to load bank details'
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { bankDetails, loading, error };
}

export function useBankTransferProof(orderId) {
  const [proof, setProof] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProof = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getBankTransferByOrder(orderId);
      const data = unwrapApiData(response);
      setProof(mapPaymentProof(data?.proof));
      setBankDetails(data?.bankDetails || null);
      setOrderInfo(data?.order || null);
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
        loadError.message ||
        'Failed to load payment information'
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadProof();
  }, [loadProof]);

  return { proof, bankDetails, orderInfo, loading, error, reload: loadProof };
}

export function usePendingBankTransfers() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadProofs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getPendingBankTransfers();
      const data = unwrapApiData(response);
      const list = Array.isArray(data) ? data : [];
      setProofs(
        list.map((item) => ({
          ...mapPaymentProof(item),
          vendor:
            item.userId?.name ||
            item.userId?.companyName ||
            item.userId?.email ||
            'Vendor',
          vendorEmail: item.userId?.email || '',
          vendorPhone: item.userId?.mobile || '',
          orderNumber: item.orderId?._id || item.orderId,
        }))
      );
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
        loadError.message ||
        'Failed to load pending verifications'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProofs();
  }, [loadProofs]);

  const approveProof = useCallback(async (proofId) => {
    if (!proofId) {
      return { success: false, message: 'Invalid payment proof selected' };
    }

    setActionLoading(proofId);
    try {
      await paymentService.approveBankTransfer(String(proofId));
      await loadProofs();
      return { success: true };
    } catch (actionError) {
      await loadProofs();
      const message =
        actionError?.response?.data?.message ||
        actionError.message ||
        'Failed to approve payment';
      return { success: false, message };
    } finally {
      setActionLoading(null);
    }
  }, [loadProofs]);

  const rejectProof = useCallback(async (proofId, reason) => {
    setActionLoading(proofId);
    try {
      await paymentService.rejectBankTransfer(proofId, reason);
      await loadProofs();
      return { success: true };
    } catch (actionError) {
      const message =
        actionError?.response?.data?.message ||
        actionError.message ||
        'Failed to reject payment';
      return { success: false, message };
    } finally {
      setActionLoading(null);
    }
  }, [loadProofs]);

  return {
    proofs,
    loading,
    error,
    actionLoading,
    reload: loadProofs,
    approveProof,
    rejectProof,
  };
}

export default useBankTransferProof;
