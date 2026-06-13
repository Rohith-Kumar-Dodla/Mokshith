import { useCallback, useEffect, useState } from 'react';
import productService from '../services/productService';
import { mapBackendProduct, mapBackendProducts } from '../utils/productMapper';
import { unwrapApiData } from '../utils/apiResponse';

export function useProductDetails(productId) {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductDetails = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setRelatedProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await productService.getProductById(productId);
      const mappedProduct = mapBackendProduct(unwrapApiData(response));

      if (!mappedProduct) {
        throw new Error('Product not found');
      }

      setProduct(mappedProduct);

      if (mappedProduct.categoryId) {
        const relatedResponse = await productService.getAllProducts(
          {
            categoryId: mappedProduct.categoryId,
            limit: 8,
          },
          { bustCache: true }
        );
        const relatedPayload = unwrapApiData(relatedResponse);
        const mappedRelated = mapBackendProducts(relatedPayload?.products ?? relatedPayload).filter(
          (item) => item.id !== mappedProduct.id
        );
        setRelatedProducts(mappedRelated.slice(0, 4));
      } else {
        setRelatedProducts([]);
      }
    } catch (fetchError) {
      setProduct(null);
      setRelatedProducts([]);
      setError(fetchError?.response?.data?.message || fetchError.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  return {
    product,
    relatedProducts,
    loading,
    error,
    refetch: fetchProductDetails,
  };
}

export default useProductDetails;
