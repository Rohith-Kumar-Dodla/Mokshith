import { useCallback, useEffect, useState } from 'react';
import categoryService from '../services/categoryService';
import { mapBackendCategories, mapBackendCategory } from '../utils/categoryMapper';
import { unwrapApiData, unwrapApiList, getUserFacingErrorMessage } from '../utils/apiResponse';


export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchCategories = useCallback(async ({ bustCache = false, preserveOnError = false, initial = false } = {}) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const response = await categoryService.getCategories({ bustCache });
      const list = unwrapApiList(unwrapApiData(response));
      setCategories(mapBackendCategories(list));
    } catch (fetchError) {
      if (!preserveOnError) {
        setCategories([]);
      }
      setError(getUserFacingErrorMessage(fetchError, 'Failed to load categories'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories({ initial: true });
  }, [fetchCategories]);

  const upsertCategory = useCallback((category) => {
    const mapped = mapBackendCategory(category, categories.length);
    if (!mapped?.id) return;

    setCategories((current) => {
      const index = current.findIndex((item) => item.id === mapped.id);
      if (index === -1) {
        return [...current, mapped];
      }
      const next = [...current];
      next[index] = mapped;
      return next;
    });
  }, [categories.length]);

  const removeCategory = useCallback((categoryId) => {
    setCategories((current) => current.filter((item) => item.id !== categoryId));
  }, []);

  const createCategory = useCallback(async (categoryData, imageFile = null) => {
    setSaving(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const response = await categoryService.createCategory(categoryData, imageFile);
      const created = unwrapApiData(response);
      if (created) {
        upsertCategory(created);
      }
      setSuccessMessage('Category created successfully');
      await fetchCategories({ bustCache: true, preserveOnError: true });
      return true;
    } catch (saveError) {
      const message = getUserFacingErrorMessage(saveError, 'Failed to create category');
      setActionError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchCategories, upsertCategory]);

  const updateCategory = useCallback(async (categoryId, categoryData, imageFile = null) => {
    setSaving(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const response = await categoryService.updateCategory(categoryId, categoryData, imageFile);
      const updated = unwrapApiData(response);
      if (updated) {
        upsertCategory(updated);
      }
      setSuccessMessage('Category updated successfully');
      await fetchCategories({ bustCache: true, preserveOnError: true });
      return true;
    } catch (saveError) {
      const message = getUserFacingErrorMessage(saveError, 'Failed to update category');
      setActionError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchCategories, upsertCategory]);

  const deleteCategory = useCallback(async (categoryId) => {
    setSaving(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await categoryService.deleteCategory(categoryId);
      removeCategory(categoryId);
      setSuccessMessage('Category deleted successfully');
      await fetchCategories({ bustCache: true, preserveOnError: true });
      return true;
    } catch (saveError) {
      const message = getUserFacingErrorMessage(saveError, 'Failed to delete category');
      setActionError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchCategories, removeCategory]);

  const clearMessages = useCallback(() => {
    setActionError(null);
    setSuccessMessage(null);
  }, []);

  return {
    categories,
    loading,
    refreshing,
    saving,
    error,
    actionError,
    successMessage,
    refetch: () => fetchCategories({ bustCache: true }),
    createCategory,
    updateCategory,
    deleteCategory,
    clearMessages,
  };
}

export default useCategories;
