import { getImageVersion, withImageCacheBust } from './imageUtils';
import { resolveUploadUrl } from './bankTransferUtils';

const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
];

export function mapBackendCategory(category, index = 0) {
  if (!category) {
    return null;
  }

  const id = category._id || category.id;
  const storedImage = resolveUploadUrl(category.image || '') || null;
  const imageVersion = getImageVersion(category);
  const displayImage = withImageCacheBust(
    storedImage || CATEGORY_IMAGES[index % CATEGORY_IMAGES.length],
    imageVersion
  );

  return {
    ...category,
    _id: id,
    id,
    name: category.name,
    description: category.description || `Browse ${category.name} products`,
    storedImage: storedImage ? withImageCacheBust(storedImage, imageVersion) : '',
    image: displayImage,
    productCount: Number(category.productCount ?? 0),
    status: category.isActive === false ? 'inactive' : 'active',
    slug: category.slug || null,
    parentId: category.parentId || null,
    updatedAt: category.updatedAt || null,
  };
}

export function mapBackendCategories(categories = []) {
  return categories.map((category, index) => mapBackendCategory(category, index)).filter(Boolean);
}
