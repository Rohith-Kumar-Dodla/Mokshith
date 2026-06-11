import { useState, useCallback } from "react";
import { searchService } from "../searchService.js";
import { debounce } from "../../../utils/debounce.js";

export const useSearch = () => {
  const [results, setResults] = useState({ products: [], vendors: [], orders: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const performSearch = async (searchQuery, type = 'all') => {
    if (!searchQuery?.trim()) {
      setResults({ products: [], vendors: [], orders: [] });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchService.search(searchQuery, type);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 400), []);

  const search = (searchQuery, type) => {
    setQuery(searchQuery);
    debouncedSearch(searchQuery, type || activeTab);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    if (query) performSearch(query, tab);
  };

  return { results, loading, error, query, activeTab, search, changeTab };
};
