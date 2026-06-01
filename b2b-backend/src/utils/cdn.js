import { logger } from '../config/logger.js';

/**
 * CDN utilities for asset delivery optimization
 */

/**
 * Get CDN URL for static assets
 */
export const getCdnUrl = (path) => {
  const cdnUrl = process.env.CDN_URL;

  if (!cdnUrl) {
    // No CDN configured, return origin URL
    return path.startsWith('http') ? path : `${process.env.BACKEND_URL || ''}${path}`;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${cdnUrl}/${cleanPath}`;
};

/**
 * Transform image URLs to CDN URLs with optimization parameters
 */
export const transformImageUrl = (url, options = {}) => {
  const {
    width,
    height,
    quality = 85,
    format,
    fit = 'cover'
  } = options;

  // If using Cloudflare Images, Imgix, or similar CDN with image optimization
  if (process.env.CDN_IMAGE_OPTIMIZATION === 'true') {
    const cdnUrl = getCdnUrl(url);
    const params = new URLSearchParams();

    if (width) params.append('w', width);
    if (height) params.append('h', height);
    if (quality) params.append('q', quality);
    if (format) params.append('f', format);
    if (fit) params.append('fit', fit);

    return params.toString() ? `${cdnUrl}?${params.toString()}` : cdnUrl;
  }

  return getCdnUrl(url);
};

/**
 * Generate responsive image srcset
 */
export const generateSrcSet = (url, widths = [320, 640, 768, 1024, 1280, 1920]) => {
  return widths
    .map(width => `${transformImageUrl(url, { width })} ${width}w`)
    .join(', ');
};

/**
 * Get cache control header for asset type
 */
export const getCacheControl = (assetType) => {
  const cacheRules = {
    image: 'public, max-age=31536000, immutable', // 1 year
    video: 'public, max-age=31536000, immutable',
    document: 'public, max-age=86400', // 1 day
    api: 'no-cache, no-store, must-revalidate',
    static: 'public, max-age=604800', // 1 week
    default: 'public, max-age=3600' // 1 hour
  };

  return cacheRules[assetType] || cacheRules.default;
};

/**
 * Transform product images to CDN URLs
 */
export const transformProductImages = (product) => {
  if (!product) return product;

  const transformed = { ...product };

  // Transform single image
  if (transformed.image) {
    transformed.image = getCdnUrl(transformed.image);
  }

  // Transform images array
  if (transformed.images && Array.isArray(transformed.images)) {
    transformed.images = transformed.images.map(img => getCdnUrl(img));
  }

  // Generate thumbnail if needed
  if (transformed.image && process.env.CDN_IMAGE_OPTIMIZATION === 'true') {
    transformed.thumbnail = transformImageUrl(transformed.image, {
      width: 300,
      height: 300,
      quality: 80
    });
  }

  return transformed;
};

/**
 * Transform array of products
 */
export const transformProductsArray = (products) => {
  return products.map(transformProductImages);
};

/**
 * Purge CDN cache (for Cloudflare, Fastly, etc.)
 */
export const purgeCdnCache = async (urls) => {
  if (!process.env.CDN_PURGE_ENABLED === 'true') {
    logger.warn('CDN purge not enabled');
    return;
  }

  try {
    // Implement based on your CDN provider
    // Example for Cloudflare:
    if (process.env.CDN_PROVIDER === 'cloudflare') {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ files: urls })
        }
      );

      if (response.ok) {
        logger.info('CDN cache purged successfully', { urls });
      } else {
        logger.error('CDN cache purge failed', await response.text());
      }
    }
  } catch (error) {
    logger.error('CDN purge error:', error);
  }
};
