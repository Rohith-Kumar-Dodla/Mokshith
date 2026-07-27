const joinParts = (parts) => parts.filter(Boolean).join(', ');

export const formatVendorAddressLine = (vendorAddress = {}) => {
  const { line1, line2, area } = vendorAddress;
  return joinParts([line1, line2, area]);
};

export const formatVendorAddressFull = (vendorAddress = {}) => {
  const { line1, line2, area, city, district, state, country, pincode } = vendorAddress;
  const locality = joinParts([line1, line2, area, city, district, state, country]);
  return pincode ? `${locality} - ${pincode}` : locality;
};

export const vendorAddressToShippingAddress = (user = {}) => {
  const vendorAddress = user.vendorAddress;
  if (!vendorAddress?.line1 || !vendorAddress?.city || !vendorAddress?.state || !vendorAddress?.pincode) {
    return null;
  }

  const phone = String(user.mobile || user.phone || '').replace(/\D/g, '').slice(-10);
  if (phone.length !== 10) {
    return null;
  }

  return {
    name: user.ownerName || user.businessName || user.name || 'Vendor',
    phone,
    addressLine: formatVendorAddressLine(vendorAddress),
    city: vendorAddress.city,
    state: vendorAddress.state,
    pincode: String(vendorAddress.pincode).replace(/\D/g, '').slice(0, 6),
  };
};

export const syncLegacyAddressFromVendorAddress = (vendorAddress = {}) =>
  formatVendorAddressFull(vendorAddress);
