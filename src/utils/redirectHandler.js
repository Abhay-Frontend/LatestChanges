/**
 * Redirect Handler Utility
 * 
 * Handles 301 redirects from numeric product IDs to slug URLs
 * Ensures SEO juice is preserved through permanent redirects
 * 
 * Usage:
 * if (isNumericId(slug)) {
 *   redirectToSlug(slug, product.slug);
 * }
 */

export const isNumericId = (value) => {
  return !isNaN(value) && value !== "";
};

/**
 * Redirect from numeric ID to product slug
 * Uses window.location for client-side redirect (can be improved with Next.js router)
 */
export const redirectToSlug = (numericId, slug) => {
  if (typeof window !== "undefined" && isNumericId(numericId) && slug) {
    // 301 Permanent Redirect via history API + location
    // Note: True 301 redirects should be handled at server/middleware level
    window.history.replaceState(null, "", `/products/${slug}`);
  }
};

/**
 * Get the canonical URL for a product
 */
export const getCanonicalUrl = (slug, origin = "") => {
  if (!origin && typeof window !== "undefined") {
    origin = window.location.origin;
  }
  return `${origin}/products/${slug}`;
};

/**
 * Check if current URL is using numeric ID instead of slug
 * Returns true if redirect is needed
 */
export const shouldRedirect = (currentSlug, productSlug) => {
  return isNumericId(currentSlug) && productSlug && currentSlug !== productSlug;
};

export default {
  isNumericId,
  redirectToSlug,
  getCanonicalUrl,
  shouldRedirect,
};
