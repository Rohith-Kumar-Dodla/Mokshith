import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cartService from '../services/cartService';
import { mapBackendCart } from '../utils/cartMapper';
import { calculateCartTotals } from '../utils/pricingCalculator';

import { unwrapApiData } from '../utils/apiResponse';

function extractCartPayload(response) {
  return unwrapApiData(response);
}

export function useCart({ autoLoad = true } = {}) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const addInFlightRef = useRef(false);

  const applyCartResponse = useCallback((response) => {
    const mappedCart = mapBackendCart(extractCartPayload(response));
    setCart(mappedCart);
    return mappedCart;
  }, []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await cartService.getCart();
      return applyCartResponse(response);
    } catch (loadError) {
      setCart(mapBackendCart(null));
      setError(
        loadError?.response?.data?.message || loadError.message || 'Failed to load cart'
      );
      return mapBackendCart(null);
    } finally {
      setLoading(false);
    }
  }, [applyCartResponse]);

  useEffect(() => {
    if (autoLoad) {
      loadCart();
    }
  }, [autoLoad, loadCart]);

  const addToCart = useCallback(
    async (productId, quantity) => {
      if (addInFlightRef.current) {
        return;
      }
      addInFlightRef.current = true;
      setActionLoading(true);
      setError(null);

      try {
        const response = await cartService.addToCart(productId, quantity);
        return applyCartResponse(response);
      } catch (addError) {
        const message =
          addError?.response?.data?.message || addError.message || 'Failed to add item to cart';
        setError(message);
        throw new Error(message);
      } finally {
        addInFlightRef.current = false;
        setActionLoading(false);
      }
    },
    [applyCartResponse]
  );

  const removeFromCart = useCallback(
    async (productId) => {
      setActionLoading(true);
      setError(null);

      try {
        const response = await cartService.removeFromCart(productId);
        return applyCartResponse(response);
      } catch (removeError) {
        const message =
          removeError?.response?.data?.message ||
          removeError.message ||
          'Failed to remove item from cart';
        setError(message);
        throw new Error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [applyCartResponse]
  );

  const cartItems = useMemo(() => cart?.items ?? [], [cart]);

  const totals = useMemo(() => calculateCartTotals(cartItems), [cartItems]);

  return {
    loading,
    actionLoading,
    error,
    cart,
    cartItems,
    subtotal: totals.subtotal,
    discount: totals.discount,
    bulkDiscount: totals.bulkDiscount,
    tax: totals.tax,
    grandTotal: totals.grandTotal,
    itemCount: totals.itemCount,
    loadCart,
    addToCart,
    removeFromCart,
  };
}

export default useCart;
