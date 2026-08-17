const formatSupplierPrice = (value) => {
  if (value == null || value === '') return 'Not Set';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Not Set';
  return `₹${amount.toFixed(2)}`;
};

export { formatSupplierPrice };
