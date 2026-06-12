const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function computeMonthlySpending(orders = [], months = 6) {
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: MONTHS[date.getMonth()],
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      amount: 0,
    });
  }

  orders.forEach((order) => {
    if (!order.createdAt) return;
    const created = new Date(order.createdAt);
    const bucket = buckets.find(
      (entry) => entry.monthIndex === created.getMonth() && entry.year === created.getFullYear()
    );
    if (bucket) {
      bucket.amount += Number(order.amount || 0);
    }
  });

  return buckets.map(({ month, amount }) => ({ month, amount }));
}

export function computeTopCategories(orders = []) {
  const categoryTotals = {};

  orders.forEach((order) => {
    const items = order.raw?.items || order.items || [];
    items.forEach((item) => {
      const category =
        item.productId?.category?.name ||
        item.productId?.categoryName ||
        item.category ||
        'General';
      const lineTotal = Number(item.finalPrice ?? item.price ?? 0) * Number(item.quantity ?? 1);
      categoryTotals[category] = (categoryTotals[category] || 0) + lineTotal;
    });
  });

  const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0) || 1;

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

export function computeFrequentlyOrderedProducts(orders = []) {
  const productMap = {};

  orders.forEach((order) => {
    const items = order.raw?.items || order.items || [];
    items.forEach((item) => {
      const key = item.productId?._id || item.productId || item.name;
      if (!key) return;
      const name = item.name || item.productId?.name || 'Product';
      if (!productMap[key]) {
        productMap[key] = { productName: name, orderCount: 0, totalQuantity: 0 };
      }
      productMap[key].orderCount += 1;
      productMap[key].totalQuantity += Number(item.quantity ?? 0);
    });
  });

  return Object.values(productMap)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);
}

export function computeVendorAnalytics(orders = [], credit = null) {
  const now = new Date();
  const thisMonthSpending = orders
    .filter((order) => {
      if (!order.createdAt) return false;
      const created = new Date(order.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + Number(order.amount || 0), 0);

  const totalSpending = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

  return {
    summary: {
      totalOrders: orders.length,
      totalSpending,
      thisMonthSpending,
      availableCredit: Number(credit?.availableCredit ?? 0),
      usedCredit: Number(credit?.usedCredit ?? 0),
      creditLimit: Number(credit?.creditLimit ?? 0),
    },
    monthlySpending: computeMonthlySpending(orders),
    topCategories: computeTopCategories(orders),
    frequentlyOrderedProducts: computeFrequentlyOrderedProducts(orders),
  };
}
