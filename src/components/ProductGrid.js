"use client";
import { useRef, useEffect } from "react";
import ListingCard from "@/components/ListingCard";

const ProductGrid = ({
  products,
  isLoading,
  isSearching,
  isFilterLoading,
  isSortLoading,
  isFilterApplied,
  hasMore,
  subCategoryId,
  onLoadMore,
  onBrowseAll,
}) => {
  const observerTarget = useRef(null);

  // INFINITE SCROLL - Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // LOADING (Filter, Sort, or Pagination)
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // SEARCHING
  if (isSearching) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        Searching products...
      </div>
    );
  }

  // SORT LOADING
  if (isSortLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // NO PRODUCTS
  if (products?.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <div className="text-gray-900 text-xl font-semibold mb-2">
          {isFilterApplied
            ? "No products available according to selected filters."
            : "No products found"}
        </div>
        <button
          onClick={onBrowseAll}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 cursor-pointer"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  // PRODUCTS GRID
  return (
    <>
      <div
        className="
          grid 
          grid-cols-2 
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-3
          xl:grid-cols-4 
          gap-6 sm:gap-8 lg:gap-10
        "
      >
        {products.map((product, index) => {
          const mrp = Number(product.mrp);
          const basePrice = Number(product.basePrice);
          const discountPercentage =
            !isNaN(mrp) && !isNaN(basePrice) && mrp > 0
              ? Math.round(((mrp - basePrice) / mrp) * 100)
              : 0;

          return (
            <ListingCard
              key={`${product.id}-${index}`}
              imageUrls={product.imageUrls || []}
              title={product.title}
              brand={product.brand?.name || ""}
              rating={product.rating || 0}
              reviewCount={product.numReviews?.toString() || ""}
              basePrice={basePrice}
              mrp={mrp}
              discountPercentage={`${discountPercentage}`}
              id={product.id}
              slug={product.slug}
              shopifyHandles={product.shopifyHandles}
            />
          );
        })}
      </div>

      {/* Infinite Scroll Observer Target */}
      <div ref={observerTarget} className="py-8 flex justify-center">
        {hasMore && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        )}
      </div>
    </>
  );
};

export default ProductGrid;
