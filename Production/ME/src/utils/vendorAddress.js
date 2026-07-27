export const EMPTY_VENDOR_ADDRESS = {
  line1: '',
  line2: '',
  area: '',
  city: '',
  district: '',
  state: '',
  country: 'India',
  pincode: '',
  location: {
    latitude: '',
    longitude: '',
  },
};

export const formatVendorAddressLine = (vendorAddress = {}) => {
  const parts = [vendorAddress.line1, vendorAddress.line2, vendorAddress.area].filter(Boolean);
  return parts.join(', ');
};

export const formatVendorAddressFull = (vendorAddress = {}) => {
  const parts = [
    vendorAddress.line1,
    vendorAddress.line2,
    vendorAddress.area,
    vendorAddress.city,
    vendorAddress.district,
    vendorAddress.state,
    vendorAddress.country,
  ].filter(Boolean);
  const base = parts.join(', ');
  return vendorAddress.pincode ? `${base} - ${vendorAddress.pincode}` : base;
};

export const vendorProfileToCheckoutForm = (user = {}) => {
  const vendorAddress = user.vendorAddress || {};
  return {
    businessName: user.businessName || user.companyName || '',
    contactPerson: user.ownerName || user.name || '',
    phone: user.mobile || user.phone || '',
    email: user.email || '',
    deliveryAddress: formatVendorAddressLine(vendorAddress) || user.businessAddress || user.address || '',
    city: vendorAddress.city || '',
    state: vendorAddress.state || '',
    pincode: vendorAddress.pincode || '',
  };
};

export const mapUserVendorAddress = (user = {}) => {
  if (user.vendorAddress?.line1) {
    return {
      ...EMPTY_VENDOR_ADDRESS,
      ...user.vendorAddress,
      location: {
        ...EMPTY_VENDOR_ADDRESS.location,
        ...(user.vendorAddress.location || {}),
      },
    };
  }

  return { ...EMPTY_VENDOR_ADDRESS };
};

export const buildVendorAddressPayload = (addressForm) => {
  const payload = {
    line1: addressForm.line1?.trim(),
    line2: addressForm.line2?.trim() || '',
    area: addressForm.area?.trim(),
    city: addressForm.city?.trim(),
    district: addressForm.district?.trim(),
    state: addressForm.state?.trim(),
    country: addressForm.country?.trim() || 'India',
    pincode: String(addressForm.pincode || '').replace(/\D/g, '').slice(0, 6),
  };

  const latitude = addressForm.location?.latitude;
  const longitude = addressForm.location?.longitude;
  if (latitude !== '' && latitude != null && longitude !== '' && longitude != null) {
    payload.location = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  }

  return payload;
};
