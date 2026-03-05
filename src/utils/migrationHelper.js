/**
 * Product Migration Utilities
 * 
 * Helpers for migrating from shopifyHandles to slug URLs
 * Can be used for batch operations or as reference for backend migrations
 */

/**
 * Generate a clean slug from product title and handle
 * Priority: product.slug > shopifyHandles > generated from title
 */
export const generateSlugFromProduct = (product) => {
  // If slug already exists, use it
  if (product.slug) {
    return product.slug;
  }

  // If shopifyHandles exists, use it as slug
  if (product.shopifyHandles) {
    return product.shopifyHandles;
  }

  // Generate from title
  if (product.title) {
    return product.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .replace(/-+/g, "-") // Remove multiple dashes
      .slice(0, 75); // Max length
  }

  return null;
};

/**
 * Check if product needs slug migration
 */
export const needsSlugMigration = (product) => {
  return !product.slug && (product.shopifyHandles || product.title);
};

/**
 * Get migration stats for a product list
 * Returns: { total, needsMigration, ready }
 */
export const getMigrationStats = (products = []) => {
  const total = products.length;
  const needsMigration = products.filter(p => needsSlugMigration(p)).length;
  const ready = total - needsMigration;

  return {
    total,
    needsMigration,
    ready,
    percentComplete: Math.round((ready / total) * 100) || 0,
  };
};

/**
 * Create migration payload for a product
 * Use this to prepare data for backend migration
 */
export const createMigrationPayload = (product) => {
  if (!needsSlugMigration(product)) {
    return null;
  }

  const newSlug = generateSlugFromProduct(product);

  return {
    id: product.id,
    slug: newSlug,
    source: product.shopifyHandles ? "shopifyHandles" : "title",
    originalHandle: product.shopifyHandles || null,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Batch create migration payloads
 */
export const createBatchMigrationPayload = (products = []) => {
  return products
    .filter(p => needsSlugMigration(p))
    .map(p => createMigrationPayload(p))
    .filter(Boolean);
};

/**
 * Validate slug uniqueness (client-side check)
 * Note: Backend should also validate for true uniqueness
 */
export const validateSlugUniqueness = (slug, products = []) => {
  const count = products.filter(
    p => (p.slug === slug || p.shopifyHandles === slug)
  ).length;
  return count <= 1; // Should only exist once
};

/**
 * Format migration report
 */
export const formatMigrationReport = (stats) => {
  return `
Migration Status Report:
- Total Products: ${stats.total}
- Needing Migration: ${stats.needsMigration}
- Already Complete: ${stats.ready}
- Progress: ${stats.percentComplete}%
  `;
};

export default {
  generateSlugFromProduct,
  needsSlugMigration,
  getMigrationStats,
  createMigrationPayload,
  createBatchMigrationPayload,
  validateSlugUniqueness,
  formatMigrationReport,
};
