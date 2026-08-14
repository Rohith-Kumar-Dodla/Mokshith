import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cartService from '../services/cartService';
import { mapBackendCart } from '../utils/cartMapper';
import { calculateCartTotals } from '../utils/pricingCalculator';

import { unwrapApiData, getUserFacingErrorMessage } from '../utils/apiResponse';

export const CART_UPDATED_EVENT = 'mokshith:cart-updated';

function extractCartPayload(response) {
  return unwrapApiData(response);
}

function emitCartUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function useCart({ autoLoad = true } = {}) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const addInFlightRef = useRef(false);
  const skipReloadRef = useRef(false);

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
        getUserFacingErrorMessage(loadError, 'Failed to load cart')
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

  useEffect(() => {
    if (!autoLoad) return undefined;

    const onCartUpdated = () => {
      if (skipReloadRef.current) {
        skipReloadRef.current = false;
        return;
      }
      loadCart();
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
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
        const mappedCart = applyCartResponse(response);
        skipReloadRef.current = true;
        emitCartUpdated();
        return mappedCart;
      } catch (addError) {
        const message =
          getUserFacingErrorMessage(addError, 'Failed to add item to cart');
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
        const mappedCart = applyCartResponse(response);
        skipReloadRef.current = true;
        emitCartUpdated();
        return mappedCart;
      } catch (removeError) {
        const message =
          getUserFacingErrorMessage(removeError, 'Failed to remove item from cart');
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
