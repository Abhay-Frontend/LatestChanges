/**
 * SEO Schema Generator
 * 
 * Generates structured data (JSON-LD) for products
 * Improves search engine understanding and rich snippets
 */

export const generateProductSchema = (product, baseUrl = "") => {
  if (!product) return null;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title || "",
    description: product.description || "",
    image: product.imageUrls || [],
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "LF-Web",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${product.slug || product.shopifyHandles || product.id}`,
      priceCurrency: "INR",
      price: product.basePrice?.toString() || "0",
      availability: product.inventory?.availableStock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "LF-Web",
      },
    },
    aggregateRating: product.rating ? {
      "@type": "AggregateRating",
      ratingValue: product.rating.toString(),
      reviewCount: (product.numReviews || 0).toString(),
    } : undefined,
    sku: product.shopifyHandles || product.id?.toString() || "",
    gtin: product.shopifyHandles || "",
  };
};

/**
 * Generate breadcrumb schema for SEO
 */
export const generateBreadcrumbSchema = (product) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: "/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product?.title || "Product",
        item: `/products/${product?.slug || product?.shopifyHandles || product?.id}`,
      },
    ],
  };
};

/**
 * Inject structured data as JSON-LD script tag
 */
export const injectSchemaTag = (schema) => {
  if (typeof document === "undefined") return null;

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.innerHTML = JSON.stringify(schema);
  
  // Remove old schema if exists
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) existing.remove();
  
  document.head.appendChild(script);
};

export default {
  generateProductSchema,
  generateBreadcrumbSchema,
  injectSchemaTag,
};
