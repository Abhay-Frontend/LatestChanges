// App.jsx
"use client";
import HeroBanner from "@/components/BrandBanner";
import BrandProductCard from "@/components/BrandProductCard";
import SearchFilterBar from "@/components/BrandSearch";
import Footer from "@/components/footer";
import useGetBrandsProducts from "@/hooks/useViewBrandsProduct";
import useUnifiedFilter from "@/hooks/useUnifiedFilter";
import { useParams } from "next/navigation";

import React, { useState, useEffect, useRef, useCallback } from "react";

const BrandProduct = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { id } = useParams(); // ✅ get the brandId from URL (e.g., /brands/12 → id = "12")

  // Get brand info (for banner)
  const getBrandsProducts = useGetBrandsProducts(id);
  const brandInfo = getBrandsProducts?.brandInfo || {};
  const brandName = brandInfo.name || "Brand Name";
  const brandDescription = brandInfo.description || "Brand Description";
  const brandVideo = brandInfo.video;

  // Use unified filter for products
  const { products, isLoading, hasMore, applyFilters, loadMore } =
    useUnifiedFilter();

  const categories = ["All", "Men", "Women", "Accessories"];

  // Map category to superCatId
  const getSuperCatId = (category) => {
    switch (category) {
      case "Men":
        return 1;
      case "Women":
        return 2;
      case "Accessories":
        return 3;
      default:
        return null;
    }
  };

  // Apply filters when parameters change
  useEffect(() => {
    if (!id) return;

    const brandIdArray = Array.isArray(id) ? id : [id];
    const brandIdNumbers = brandIdArray.map((item) => Number(item));

    applyFilters({
      brandIds: brandIdNumbers,
      sort: sortBy,
      superCatId: getSuperCatId(selectedCategory),
      key: searchQuery || null,
      pageNumber: 1,
      isLoadMore: false,
    });
  }, [id, sortBy, selectedCategory, searchQuery, applyFilters]);

  // Infinite scroll handler
  const observer = useRef();
  const lastProductRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadMore],
  );

  // Show error state
  if (getBrandsProducts?.error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-red-500">Error loading brand data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white mt-[135px] md:mt-[130px]">
      <HeroBanner
        brandName={brandName}
        description={brandDescription}
        logo={brandInfo.logo}
        videoURL={brandVideo}
      />

      <SearchFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        categories={categories}
      />

      <div className="w-full md:px-[100px] md:py-0 px-4 p-12">
        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product, index) => {
                // Attach ref to the last product for infinite scroll
                if (products.length === index + 1) {
                  return (
                    <div ref={lastProductRef} key={product.id}>
                      <BrandProductCard
                        image={
                          product.imageUrls?.[0] ||
                          "https://via.placeholder.com/400"
                        }
                        title={product.title}
                        price={product.basePrice}
                        mrp={product.mrp}
                        productId={product.id}
                        slug={product.slug}
                        shopifyHandles={product.shopifyHandles}
                        hasCOD={product.hasCOD}
                        hasExchange={product.hasExchange}
                      />
                    </div>
                  );
                }
                return (
                  <BrandProductCard
                    key={product.id}
                    image={
                      product.imageUrls?.[0] ||
                      "https://via.placeholder.com/400"
                    }
                    title={product.title}
                    price={product.basePrice}
                    mrp={product.mrp}
                    productId={product.id}
                    slug={product.slug}
                    shopifyHandles={product.shopifyHandles}
                    hasCOD={product.hasCOD}
                    hasExchange={product.hasExchange}
                  />
                );
              })}
            </div>
            {isLoading && products.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500 text-center">No products available</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BrandProduct;
