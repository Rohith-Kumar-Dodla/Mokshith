import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import searchService from '../services/searchService';
import {
  applyClientProductFilters,
  mapBackendProduct,
  mapBackendProducts,
} from '../utils/productMapper';
import { unwrapApiData, getUserFacingErrorMessage } from '../utils/apiResponse';

const DEFAULT_LIMIT = 100;

export function useProducts() {
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get('categoryId');

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilters, setClientFilters] = useState({
    categoryIds: categoryIdFromUrl ? [categoryIdFromUrl] : [],
    categories: [],
    brands: [],
    priceRange: { min: '', max: '' },
    availability: 'all',
    sortBy: 'relevance',
  });

  const fetchProducts = useCallback(async ({ bustCache = false, preserveOnError = false, initial = false } = {}) => {
    if (initial) {
      setLoading(true);
    }
    setError(null);

    try {
      const params = {
        limit: DEFAULT_LIMIT,
      };

      if (categoryIdFromUrl) {
        params.categoryId = categoryIdFromUrl;
      }

      const trimmedSearch = searchTerm.trim();

      if (trimmedSearch) {
        const searchResult = await searchService.searchProducts(trimmedSearch);
        setProducts(searchResult.products);
        setPagination(searchResult.pagination);
        return;
      }

      const response = await productService.getAllProducts(params, { bustCache });
      const payload = unwrapApiData(response);
      const mappedProducts = mapBackendProducts(payload?.products ?? payload);

      setProducts(mappedProducts);
      setPagination(payload?.pagination ?? null);
    } catch (fetchError) {
      if (!preserveOnError) {
        setProducts([]);
        setPagination(null);
      }
      setError(getUserFacingErrorMessage(fetchError, 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [categoryIdFromUrl, searchTerm]);

  useEffect(() => {
    setClientFilters((current) => ({
      ...current,
      categoryIds: categoryIdFromUrl ? [categoryIdFromUrl] : current.categoryIds,
    }));
  }, [categoryIdFromUrl]);

  useEffect(() => {
    fetchProducts({ initial: true });
  }, [fetchProducts]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleFilterChange = useCallback((filters) => {
    setClientFilters((current) => ({
      ...current,
      ...filters,
    }));
  }, []);

  const filteredProducts = useMemo(
    () =>
      applyClientProductFilters(products, {
        ...clientFilters,
        searchTerm: searchTerm.trim() ? '' : clientFilters.searchTerm,
      }),
    [products, clientFilters, searchTerm]
  );

  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand).filter(Boolean))],
    [products]
  );

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const getActionErrorMessage = (actionError, fallback) =>
    getUserFacingErrorMessage(actionError, fallback;

  const upsertProduct = useCallback((product) => {
    const mapped = mapBackendProduct(product);
    if (!mapped?.id) return;

    setProducts((current) => {
      const index = current.findIndex((item) => item.id === mapped.id);
      if (index === -1) {
        return [mapped, ...current];
      }
      const next = [...current];
      next[index] = mapped;
      return next;
    });
  }, []);

  const createProduct = useCallback(async (productData, imageFile = null) => {
    setSaving(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const response = await productService.createProduct(productData, imageFile);
      const created = unwrapApiData(response);
      if (created) {
        upsertProduct(created);
      }
      setSuccessMessage('Product created successfully');
      await fetchProducts({ bustCache: true, preserveOnError: true });
      return true;
    } catch (saveError) {
      const message = getActionErrorMessage(saveError, 'Failed to create product');
      setActionError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchProducts, upsertProduct]);

  const updateProduct = useCallback(async (productId, productData, imageFile = null) => {
    setSaving(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const response = await productService.updateProduct(productId, productData, imageFile);
      const updated = unwrapApiData(response);
      if (updated) {
        upsertProduct(updated);
      }
      setSuccessMessage('Product updated successfully');
      await fetchProducts({ bustCache: true, preserveOnError: true });
      return true;
    } catch (saveError) {
      const message = getActionErrorMessage(saveError, 'Failed to update product');
      setActionError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchProducts, upsertProduct]);

  const deleteProduct = useCallback(async (productId) => {
    setSaving(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await productService.deleteProduct(productId);
      setSuccessMessage('Product deleted successfully');
      await fetchProducts({ bustCache: true, preserveOnError: true });
      return true;
    } catch (saveError) {
      const message = getActionErrorMessage(saveError, 'Failed to delete product');
      setActionError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchProducts]);

  const clearMessages = useCallback(() => {
    setActionError(null);
    setSuccessMessage(null);
  }, []);

  return {
    products,
    filteredProducts,
    pagination,
    loading,
    saving,
    error,
    actionError,
    successMessage,
    searchTerm,
    categoryIdFromUrl,
    brands,
    handleSearch,
    handleFilterChange,
    refetch: () => fetchProducts({ bustCache: true }),
    createProduct,
    updateProduct,
    deleteProduct,
    clearMessages,
  };
}

export default useProducts;
