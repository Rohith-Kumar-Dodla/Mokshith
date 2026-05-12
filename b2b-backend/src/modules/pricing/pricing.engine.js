import { fetchSetting } from '../settings/settings.service.js';

export const calculatePrice = async ({ basePrice, quantity }) => {
  const dynamicPricingFlag = await fetchSetting('dynamicPricing');
  
  if (dynamicPricingFlag && dynamicPricingFlag.value === false) {
    return basePrice;
  }

  if (quantity >= 100) return basePrice * 0.8; // 20% discount
  if (quantity >= 50) return basePrice * 0.9;  // 10% discount

  return basePrice;
};