export const isActiveSupplierStatus = (status) => status === 'ACTIVE';

export const canActivateSupplier = (status) => status === 'APPROVED' || status === 'INACTIVE';

export const canApproveSupplier = (status) => status === 'PENDING';

export const getSupplierActivationCopy = (status, context = 'overview') => {
  if (isActiveSupplierStatus(status)) {
    return null;
  }

  const productsMessage = 'Only ACTIVE suppliers can receive new supplier products.';
  const categoriesMessage = 'Only ACTIVE suppliers can receive new supplier categories.';

  if (status === 'APPROVED') {
    const overviewMessage =
      'Supplier is approved but not active. Activate the supplier before adding products or categories.';
    return {
      title: 'Supplier activation required',
      message:
        context === 'products'
          ? productsMessage
          : context === 'categories'
            ? categoriesMessage
            : overviewMessage,
      showActivate: true,
      showApprove: false,
    };
  }

  if (status === 'PENDING') {
    const overviewMessage =
      'This supplier is pending approval. Approve and activate the supplier before adding products or categories.';
    return {
      title: 'Supplier approval required',
      message:
        context === 'products'
          ? productsMessage
          : context === 'categories'
            ? categoriesMessage
            : overviewMessage,
      showActivate: false,
      showApprove: true,
    };
  }

  if (status === 'INACTIVE') {
    const overviewMessage =
      'This supplier is inactive. Activate the supplier before adding products or categories.';
    return {
      title: 'Supplier activation required',
      message:
        context === 'products'
          ? productsMessage
          : context === 'categories'
            ? categoriesMessage
            : overviewMessage,
      showActivate: true,
      showApprove: false,
    };
  }

  return null;
};
