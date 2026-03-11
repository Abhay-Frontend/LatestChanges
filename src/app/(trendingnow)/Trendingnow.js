"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCollectionCard from "@/components/homepage/CollectionCard";
import ViewAllCard from "@/components/homepage/ViewAllCard";
import useCollection from "@/hooks/useCollection";
import BannerGrid from "@/components/collections/BannerGrid";
import useSortProducts from "@/hooks/useSortProducts";
import SortByDropdown from "@/components/SortByDropdown";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TrendingNowSection = () => {
  const {
    data: collections,
    loading,
    error,
  } = useCollection("displayFor=homepage");
  const [currentPages, setCurrentPages] = useState({});

  // Use the reusable sort hook
  const {
    sortOrders,
    showSortDropdown,
    handleSortChange,
    toggleSortDropdown,
    sortProducts,
  } = useSortProducts();

  // Pagination: 8 products, then 8, then 7 (total 23)
  const pageItemCounts = [8, 8, 7];

  const handlePrevPage = (collectionId) => {
    setCurrentPages((prev) => ({
      ...prev,
      [collectionId]: Math.max((prev[collectionId] || 0) - 1, 0),
    }));
  };

  const handleNextPage = (collectionId, totalPages) => {
    setCurrentPages((prev) => ({
      ...prev,
      [collectionId]: Math.min((prev[collectionId] || 0) + 1, totalPages - 1),
    }));
  };

  if (loading) {
    return (
      <div className="bg-white py-16 px-4 sm:px-6 md:px-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-stone-950"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-16 px-4 sm:px-6 md:px-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-red-500">
            Error loading collections. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Reorder collections so priority sections appear first
  const priorityOrder = ["Trending Now", "Celebrity Edit"];

  const sortedCollections = [...(collections || [])].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.name);
    const bIndex = priorityOrder.indexOf(b.name);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return 0; // keep original API order for others
  });

  //product collection now showing according to the position
  return (
    <div className="bg-white">
      {sortedCollections?.map((collection, collectionIndex) => {
        // Get banners from collection data
        const banners = collection.banners || [];
        const hasProducts =
          collection.products && collection.products.length > 0;
        const hasBanners = banners.length > 0;

        // If no products and no banners, don't show anything
        if (!hasProducts && !hasBanners) {
          return null;
        }

        // If no products but has banners, show only banners
        // if (!hasProducts && hasBanners) {
        //   return (
        //     <section key={collection.id} className="py-4 px-4 sm:px-6 md:px-10">
        //       <div className="-mx-4 sm:-mx-6 md:-mx-10">
        //         <BannerGrid
        //           banners={banners}
        //           bannerCount={banners.length}
        //           displayFor="homepage"
        //         />
        //       </div>
        //     </section>
        //   );
        // }

        const currentPage = currentPages[collection.id] || 0;
        const totalPages = pageItemCounts.length;
        const totalProducts = collection.products.length;
        const shouldDisableChevrons = totalProducts <= 8;

        // Apply sorting before pagination
        const sortOrder = sortOrders[collection.id] || "default";
        const sortedProducts = sortProducts(collection.products, sortOrder);

        // Calculate start and end indices based on cumulative item counts
        let startIndex = 0;
        for (let i = 0; i < currentPage; i++) {
          startIndex += pageItemCounts[i];
        }
        const endIndex = startIndex + (pageItemCounts[currentPage] || 0);

        const displayedProducts = sortedProducts.slice(startIndex, endIndex);

        return (
          <section key={collection.id} className="py-4   px-4 sm:px-6 md:px-10">
            {/* Header */}
            <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 mb-8 sm:mb-10">
              <Link href={`/products?collectionId=${collection.id}`}>
                <h1 className="text-[13px]  md:text-[35px] font-semibold  text-black max-w-[200px] md:max-w-[700px] ">
                  {collection.name}
                </h1>
              </Link>
              <div className="flex gap-3 sm:gap-4 ml-auto items-center">
                <Link
                  href={`/products?collectionId=${collection.id}`}
                  className="group flex items-center gap-2 px-3 py-2 
                            rounded-md outline outline-1 outline-black 
                            text-black transition hover:bg-black hover:text-white"
                >
                  <span className="text-[10px] sm:text-xs uppercase font-semibold tracking-wide">
                    View All
                  </span>

                  <div className="w-5 h-5 rounded-full bg-black 
                                  flex items-center justify-center 
                                  transition group-hover:bg-white">
                    <ArrowRight className="w-3 h-3 text-white 
                                          transition group-hover:text-black 
                                          rotate-[-45deg]" />
                  </div>
                </Link>
                {/* Sort By Dropdown Component */}
                <SortByDropdown
                  collectionId={collection.id}
                  currentSort={sortOrders[collection.id] || "default"}
                  isOpen={showSortDropdown[collection.id]}
                  onToggle={() => toggleSortDropdown(collection.id)}
                  onSortChange={handleSortChange}
                />

                <button
                  onClick={() => handlePrevPage(collection.id)}
                  disabled={currentPage === 0 || shouldDisableChevrons}
                  className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border rounded-full flex items-center justify-center cursor-pointer transition text-sm sm:text-base ${currentPage === 0 || shouldDisableChevrons
                    ? "text-[#A0A0A0]"
                    : "text-black hover:bg-stone-950 hover:text-white"
                    }`}
                >
                  <ChevronLeft
                    size={16}
                    className="sm:w-4 sm:h-4 md:w-5 md:h-5"
                  />
                </button>

                <button
                  onClick={() => handleNextPage(collection.id, totalPages)}
                  disabled={
                    currentPage === totalPages - 1 || shouldDisableChevrons
                  }
                  className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border rounded-full flex items-center justify-center cursor-pointer transition text-sm sm:text-base ${currentPage === totalPages - 1 || shouldDisableChevrons
                    ? "text-[#A0A0A0]"
                    : "text-black hover:bg-stone-950 hover:text-white"
                    }`}
                >
                  <ChevronRight
                    size={16}
                    className="sm:w-4 sm:h-4 md:w-5 md:h-5"
                  />
                </button>
              </div>
            </div>
              {/* Banners Section */}
            {banners.length > 0 && (
              <div className="mt-6 -mx-4 sm:-mx-6 md:-mx-10">
                <BannerGrid
                  banners={banners}
                  bannerCount={banners.length}
                  displayFor="homepage"
                />
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {displayedProducts.map((product) => {
                // Extract variant sizes from variants array
                const availableSizes = product.variants
                  ? product.variants
                    .map((variant) => {
                      let options = [];
                      try {
                        if (typeof variant.selectedOptions === "string") {
                          options = JSON.parse(variant.selectedOptions);
                        } else if (Array.isArray(variant.selectedOptions)) {
                          options = variant.selectedOptions;
                        }
                      } catch (e) {
                        options = [];
                      }
                      const sizeOption = options.find(
                        (opt) => opt.name === "Size",
                      );
                      return sizeOption?.value || "";
                    })
                    .filter(Boolean)
                  : [];

                // Transform the product data to match CollectionCard requirements
                const transformedProduct = {
                  id: product.id,
                  name: product.title || product.name,
                  brand: product.brand?.name || product.brand,
                  brandId: product.brand?.id,
                  price: product.basePrice || product.price,
                  originalPrice: product.mrp,
                  description: product.description || "",
                  images: product.imageUrls || [product.image],
                  hasOverlay: product.hasOverlay || false,
                  variants: product.variants || [],
                  availableSizes: availableSizes,
                };

                return (
                  <div key={product.id} className="w-full">
                    <ProductCollectionCard product={transformedProduct} />
                  </div>
                );
              })}

              {currentPage === totalPages - 1 && (
                <div className="w-full">
                  <ViewAllCard
                    onClick={() => {
                      window.location.href = `/products?collectionId=${collection.id}`;
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default TrendingNowSection;