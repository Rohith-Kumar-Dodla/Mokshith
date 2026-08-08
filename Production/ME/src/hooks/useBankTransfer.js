import { useCallback, useEffect, useState } from 'react';
import paymentService from '../services/paymentService';
import { mapPaymentProof } from '../utils/bankTransferUtils';
import { unwrapApiData, getUserFacingErrorMessage } from '../utils/apiResponse';

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
            getUserFacingErrorMessage(loadError, 'Failed to load bank details')
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
        getUserFacingErrorMessage(loadError, 'Failed to load payment information')
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

export default useBankTransferProof;

