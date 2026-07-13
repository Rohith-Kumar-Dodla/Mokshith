import { getImageVersion, withImageCacheBust } from './imageUtils';
import { resolveUploadUrl } from './bankTransferUtils';

const DEFAULT_RATING = 4;
const DEFAULT_REVIEWS = 0;

export function deriveProductStatus(stock = 0, moq = 1, isActive) {
  if (isActive === false) {
    return 'inactive';
  }

  if (stock === 0) {
    return 'out_of_stock';
  }

  if (stock < moq) {
    return 'low_stock';
  }

  return 'active';
}

export function getCategoryName(categoryId) {
  if (!categoryId) {
    return 'Uncategorized';
  }

  if (typeof categoryId === 'object') {
    return categoryId.name || 'Uncategorized';
  }

  return String(categoryId);
}

export function getCategoryId(categoryId) {
  if (!categoryId) {
    return null;
  }

  if (typeof categoryId === 'object') {
    return categoryId._id || categoryId.id || null;
  }

  return categoryId;
}

export function normalizeBulkPricingTier(tier, basePrice, index, tiers) {
  const minQty = tier.minQty ?? tier.minQuantity ?? 0;
  const nextTier = tiers[index + 1];
  const maxQty = tier.maxQty ?? (nextTier ? (nextTier.minQty ?? nextTier.minQuantity) - 1 : null);
  const price = Number(tier.price ?? 0);
  const discount =
    tier.discount ??
    (basePrice > 0 && price < basePrice
      ? Math.round(((basePrice - price) / basePrice) * 100)
      : 0);

  return {
    minQty,
    minQuantity: minQty,
    maxQty,
    price,
    discount,
  };
}

export function normalizeBulkPricing(bulkPricing = [], basePrice = 0) {
  if (!Array.isArray(bulkPricing)) {
    return [];
  }

  const sorted = [...bulkPricing].sort(
    (a, b) => (a.minQty ?? a.minQuantity ?? 0) - (b.minQty ?? b.minQuantity ?? 0)
  );

  return sorted.map((tier, index) => normalizeBulkPricingTier(tier, basePrice, index, sorted));
}

export function mapBackendProduct(product) {
  if (!product) {
    return null;
  }

  const stock = Number(product.stock ?? 0);
  const moq = Number(product.moq ?? product.minOrderQty ?? 1);
  const price = Number(product.price ?? 0);
  const rawImage = resolveUploadUrl(product.imageUrl || product.image || '') || '';
  const imageVersion = getImageVersion(product);
  const displayImage = withImageCacheBust(rawImage, imageVersion);
  const categoryName = getCategoryName(product.categoryId);
  const categoryRefId = getCategoryId(product.categoryId);
  const brand =
    product.brand ||
    product.vendorId?.businessName ||
    product.vendorId?.name ||
    product.companyId?.name ||
    null;

  return {
    ...product,
    _id: product._id,
    id: product._id || product.id,
    category: categoryName,
    categoryId: categoryRefId,
    status: deriveProductStatus(stock, moq, product.isActive),
    minimumOrderQuantity: moq,
    storedImage: withImageCacheBust(rawImage, imageVersion),
    image: displayImage,
    imageUrl: displayImage,
    images: product.images?.length
      ? product.images.map((img) => withImageCacheBust(img, imageVersion))
      : displayImage
        ? [displayImage]
        : [],
    bulkPricing: normalizeBulkPricing(product.bulkPricing, price),
    rating: product.rating ?? DEFAULT_RATING,
    reviews: product.reviews ?? DEFAULT_REVIEWS,
    brand,
    unit: product.unit || 'unit',
    createdDate: product.createdAt || product.createdDate || null,
    updatedAt: product.updatedAt || null,
    imagePublicId: product.imagePublicId || null,
    sales: product.sales ?? 0,
    mrp: product.mrp ?? null,
    wholesalePrice: product.wholesalePrice ?? null,
    area: product.area ?? null,
  };
}

export function mapBackendProducts(products = []) {
  return products.map(mapBackendProduct).filter(Boolean);
}

export function getProductImageKey(product) {
  if (!product) {
    return 'product-image';
  }

  return `${product.id || product._id || 'product'}-${getImageVersion(product) || product.imageUrl || product.image || 'none'}`;
}

export function getBulkPriceForQuantity(product, quantity) {
  const basePrice = Number(product?.price ?? 0);
  const tiers = normalizeBulkPricing(product?.bulkPricing, basePrice);
  const qty = Number(quantity ?? 0);

  if (!tiers.length) {
    return basePrice;
  }

  const matchedTier = [...tiers]
    .reverse()
    .find((tier) => qty >= tier.minQty && (tier.maxQty == null || qty <= tier.maxQty));

  return matchedTier ? matchedTier.price : basePrice;
}

export function applyClientProductFilters(products, filters = {}) {
  let result = [...products];

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    result = result.filter(
      (product) =>
        product.name?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term)
    );
  }

  if (filters.categoryIds?.length) {
    result = result.filter((product) => filters.categoryIds.includes(product.categoryId));
  } else if (filters.categories?.length) {
    result = result.filter((product) => filters.categories.includes(product.category));
  }

  if (filters.brands?.length) {
    result = result.filter((product) => product.brand && filters.brands.includes(product.brand));
  }

  if (filters.priceRange) {
    const { min, max } = filters.priceRange;
    if (min) {
      result = result.filter((product) => product.price >= parseFloat(min));
    }
    if (max) {
      result = result.filter((product) => product.price <= parseFloat(max));
    }
  }

  if (filters.availability && filters.availability !== 'all') {
    if (filters.availability === 'in_stock') {
      result = result.filter(
        (product) => product.status === 'active' || product.status === 'low_stock'
      );
    } else if (filters.availability === 'out_of_stock') {
      result = result.filter((product) => product.status === 'out_of_stock');
    }
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'newest':
        result.sort(
          (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
        );
        break;
      case 'popularity':
        result.sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0));
        break;
      default:
        break;
    }
  }

  return result;
}
