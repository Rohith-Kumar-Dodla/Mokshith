import { useCallback, useEffect, useMemo, useState } from 'react';
import wishlistService from '../services/wishlistService';
import { mapBackendWishlist } from '../utils/wishlistMapper';

function extractPayload(response) {
  return response?.data ?? response ?? null;
}

export function useWishlist({ autoLoad = true } = {}) {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const applyWishlistResponse = useCallback((response) => {
    const mappedWishlist = mapBackendWishlist(extractPayload(response));
    setWishlist(mappedWishlist);
    return mappedWishlist;
  }, []);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await wishlistService.getWishlist();
      return applyWishlistResponse(response);
    } catch (loadError) {
      setWishlist(mapBackendWishlist(null));
      setError(
        loadError?.response?.data?.message || loadError.message || 'Failed to load wishlist'
      );
      return mapBackendWishlist(null);
    } finally {
      setLoading(false);
    }
  }, [applyWishlistResponse]);

  useEffect(() => {
    if (autoLoad) {
      loadWishlist();
    }
  }, [autoLoad, loadWishlist]);

  const addToWishlist = useCallback(
    async (productId) => {
      setActionLoading(true);
      setError(null);

      try {
        const response = await wishlistService.addToWishlist(productId);
        const mapped = applyWishlistResponse(response);
        await loadWishlist();
        return mapped;
      } catch (addError) {
        const message =
          addError?.response?.data?.message || addError.message || 'Failed to add to wishlist';
        setError(message);
        throw new Error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [applyWishlistResponse, loadWishlist]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      setActionLoading(true);
      setError(null);

      try {
        const response = await wishlistService.removeFromWishlist(productId);
        return applyWishlistResponse(response);
      } catch (removeError) {
        const message =
          removeError?.response?.data?.message ||
          removeError.message ||
          'Failed to remove from wishlist';
        setError(message);
        throw new Error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [applyWishlistResponse]
  );

  const clearWishlist = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    try {
      await wishlistService.clearWishlist();
      return applyWishlistResponse({ items: [] });
    } catch (clearError) {
      const message =
        clearError?.response?.data?.message || clearError.message || 'Failed to clear wishlist';
      setError(message);
      throw new Error(message);
    } finally {
      setActionLoading(false);
    }
  }, [applyWishlistResponse]);

  const wishlistItems = useMemo(() => wishlist?.items ?? [], [wishlist]);

  return {
    loading,
    actionLoading,
    error,
    wishlist,
    wishlistItems,
    itemCount: wishlistItems.length,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
  };
}

export default useWishlist;
