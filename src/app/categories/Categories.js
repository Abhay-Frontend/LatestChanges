"use client";
import ListingCard from "@/components/ListingCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useCategoryProducts from "@/hooks/useSubCategoryHierarchy";

const CategoryPage = () => {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("catId"); // <-- get id from URL

  const { categoryProducts, isCategoryLoading } =
    useCategoryProducts(categoryId);

  // Show loader while data is being fetched
  if (isCategoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Return null only if loading is complete but no data exists
  if (!isCategoryLoading && !categoryProducts) {
    return null;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="w-full px-4 py-6 sm:px-6  md:px-12   mt-[120px] md:mt-[150px]  mb-6 md:mb-8">
        {/* Category Header */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {categoryProducts.name}
          </h1>
        </div>

        {/* Subcategories */}
        <div className="space-y-8 sm:space-y-10 md:space-y-12">
          {categoryProducts.children
            ?.filter((subcategory) => subcategory.products?.length > 0)
            .map((subcategory) => {
              const firstFiveProducts = subcategory.products?.slice(0, 5);

              return (
                <div
                  key={subcategory.id}
                  className="border-b border-gray-200 pb-8 sm:pb-10 md:pb-12 last:border-b-0"
                >
                  {/* Subcategory Name */}
                  <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 uppercase tracking-wide">
                      {subcategory.name}
                    </h2>

                    {/* Desktop View All */}
                    {subcategory.products?.length > 5 && (
                      <Link
                        href={`/products?subCatId=${subcategory.id}`}
                        className="hidden lg:flex items-center text-[#808080] border-b border-[#808080] text-sm hover:text-gray-900 hover:border-gray-900 transition-colors whitespace-nowrap"
                      >
                        View All →
                      </Link>
                    )}
                  </div>

                  {/* Products */}
                  {firstFiveProducts?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                      {firstFiveProducts.map((product) => (
                        <ListingCard
                          key={product.id}
                          id={product.id}
                          imageUrls={product.imageUrls}
                          title={product.title}
                          brand={product.brand?.name || ""}
                          rating={product.rating}
                          reviewCount={product.numReviews}
                          basePrice={product.basePrice}
                          mrp={product.mrp}
                          discountPercentage={
                            product.mrp && product.basePrice
                              ? Math.round(
                                  ((product.mrp - product.basePrice) /
                                    product.mrp) *
                                    100,
                                )
                              : null
                          }
                          slug={product.slug}
                          shopifyHandles={product.shopifyHandles}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-10 md:py-12">
                      <p className="text-gray-500 text-sm sm:text-base md:text-lg">
                        No products available in this subcategory
                      </p>
                    </div>
                  )}

                  {/* Mobile & Tablet View All */}
                  {subcategory.products?.length > 5 && (
                    <div className="mt-4 sm:mt-5 md:mt-6 text-center lg:hidden">
                      <Link
                        href={`/products?subCatId=${subcategory.id}`}
                        className="inline-block text-sm sm:text-base text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors px-4 py-2"
                      >
                        View All Products →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
