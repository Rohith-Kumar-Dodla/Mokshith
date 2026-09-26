import { useEffect, useMemo, useState } from 'react';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import pricingService from '../services/pricingService';
import { getMoqUnitPrice, resolveEffectiveUnitPrice } from '../utils/pricingCalculator';

export function useProductPricing(product, quantity) {
  const [apiPricing, setApiPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  useEffect(() => {
    if (!product?.price || !quantity || quantity <= 0) {
      setApiPricing(null);
      setPricingError(null);
      return undefined;
    }

    let cancelled = false;

    const fetchPricing = async () => {
      setPricingLoading(true);
      setPricingError(null);

      try {
        const response = await pricingService.calculatePrice({
          price: product.price,
          quantity,
          productId: product.id || product._id,
        });
        if (!cancelled) {
          setApiPricing(response.data ?? response);
        }
      } catch (error) {
        if (!cancelled) {
          setApiPricing(null);
          setPricingError(getUserFacingErrorMessage(error, 'Failed to calculate price'));
        }
      } finally {
        if (!cancelled) {
          setPricingLoading(false);
        }
      }
    };

    fetchPricing();

    return () => {
      cancelled = true;
    };
  }, [product?.id, product?._id, product?.price, quantity]);

  const pricing = useMemo(
    () => resolveEffectiveUnitPrice({ apiPricing, product, quantity }),
    [apiPricing, product, quantity]
  );

  const moqPricing = useMemo(
    () => getMoqUnitPrice(product),
    [product]
  );

  return {
    ...pricing,
    specialDiscountAmount: Number(apiPricing?.specialDiscountAmount || 0),
    bulkDiscountAmount: Number(apiPricing?.bulkDiscountAmount || 0),
    totalDiscount: Number(apiPricing?.totalDiscount ?? pricing.discount * quantity),
    specialPromotion: apiPricing?.specialPromotion || null,
    bulkPromotion: apiPricing?.bulkPromotion || null,
    bulkMinimumQuantity: apiPricing?.bulkMinimumQuantity || null,
    moqUnitPrice: moqPricing.unitPrice,
    pricingLoading,
    pricingError,
    apiPricing,
  };
}

export default useProductPricing;
