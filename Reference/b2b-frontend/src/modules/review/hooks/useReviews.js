import { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/reviewService.js';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsData, summaryData] = await Promise.all([
        productId ? reviewService.getReviews(productId) : reviewService.getVendorReviews(),
        reviewService.getRatingSummary(productId),
      ]);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, summary, loading, error, selectedReview, setSelectedReview, refetch: fetchReviews };
};
