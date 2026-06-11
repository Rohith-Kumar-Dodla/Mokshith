export const vendorAnalytics = {
  summary: {
    totalOrders: 156,
    pendingOrders: 12,
    confirmedOrders: 8,
    processingOrders: 15,
    dispatchedOrders: 18,
    deliveredOrders: 95,
    cancelledOrders: 8,
    totalSpending: 456780.00,
    thisMonthSpending: 45600.00,
    lastMonthSpending: 38900.00,
    wishlistProducts: 5,
    rewardPoints: 2450
  },
  monthlySpending: [
    { month: 'Jan', amount: 32500 },
    { month: 'Feb', amount: 38900 },
    { month: 'Mar', amount: 42100 },
    { month: 'Apr', amount: 35600 },
    { month: 'May', amount: 38900 },
    { month: 'Jun', amount: 45600 }
  ],
  topCategories: [
    { category: 'Pulses & Dal', amount: 125000, percentage: 27 },
    { category: 'Grains & Rice', amount: 98000, percentage: 21 },
    { category: 'Cooking Oil', amount: 89000, percentage: 19 },
    { category: 'Spices', amount: 67000, percentage: 15 },
    { category: 'Flour & Atta', amount: 45000, percentage: 10 },
    { category: 'Others', amount: 32780, percentage: 8 }
  ],
  frequentlyOrderedProducts: [
    { productId: 'PRD001', productName: 'Basmati Rice Premium', orderCount: 24, totalQuantity: 1200 },
    { productId: 'PRD002', productName: 'Toor Dal (Pigeon Pea)', orderCount: 18, totalQuantity: 900 },
    { productId: 'PRD011', productName: 'Moong Dal (Green Gram)', orderCount: 15, totalQuantity: 750 },
    { productId: 'PRD016', productName: 'Chana Dal (Bengal Gram)', orderCount: 12, totalQuantity: 600 },
    { productId: 'PRD003', productName: 'Sunflower Oil 5L', orderCount: 10, totalQuantity: 300 }
  ],
  orderStatusDistribution: [
    { status: 'Delivered', count: 95, percentage: 61 },
    { status: 'Pending', count: 12, percentage: 8 },
    { status: 'Confirmed', count: 8, percentage: 5 },
    { status: 'Processing', count: 15, percentage: 10 },
    { status: 'Dispatched', count: 18, percentage: 11 },
    { status: 'Cancelled', count: 8, percentage: 5 }
  ],
  spendingTrend: [
    { period: 'Week 1', amount: 11200 },
    { period: 'Week 2', amount: 9800 },
    { period: 'Week 3', amount: 13400 },
    { period: 'Week 4', amount: 11200 }
  ],
  savingsFromDiscounts: {
    totalSavings: 45600,
    bulkDiscountSavings: 28000,
    offerDiscountSavings: 12000,
    categoryDiscountSavings: 5600
  }
};
