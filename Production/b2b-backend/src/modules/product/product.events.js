export const onProductCreated = (product) => {
  try {
    console.log('📦 Product created with inventory provisioning:', product.name);
  } catch (err) {
    console.error('Product event failed:', err.message);
  }
};