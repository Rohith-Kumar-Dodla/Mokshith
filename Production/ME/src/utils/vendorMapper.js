export const mapUserStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE') return 'approved';
  if (normalized === 'PENDING') return 'pending';
  if (normalized === 'SUSPENDED') return 'suspended';
  if (normalized === 'REJECTED') return 'rejected';
  return 'inactive';
};

export const mapBackendStatus = (uiStatus) => {
  const normalized = String(uiStatus || '').toLowerCase();
  if (normalized === 'approved') return 'ACTIVE';
  if (normalized === 'pending') return 'PENDING';
  if (normalized === 'suspended') return 'SUSPENDED';
  if (normalized === 'rejected') return 'REJECTED';
  return 'PENDING';
};

export const mapVendorUser = (user) => ({
  id: user._id || user.id,
  shopName: user.businessName || user.name || '—',
  ownerName: user.name || '—',
  phone: user.mobile || '—',
  email: user.email || '—',
  area: user.addresses?.[0]?.city || user.addresses?.[0]?.area || '—',
  orders: user.orderCount ?? '—',
  status: mapUserStatus(user.status),
  registeredDate: user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN')
    : '—',
  raw: user,
});
