import { useState, useCallback, useRef } from "react";
import axiosHttp from "@/utils/axioshttp";

const useUnifiedFilter = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Store current filter params for loadMore
  const currentFiltersRef = useRef({});

  const applyFilters = useCallback(
    async ({
      brandIds = [],
      minPrice = 0,
      maxPrice = 10000,
      sort = "",
      superCatId = null,
      subCatId = null,
      catId = null,
      sizes = [],
      colors = [],
      //collectionId = null,
      // Normalize collectionId to number
      collectionId = collectionId ? Number(collectionId) : null,
      key = null,
      fits=[],
      clothingTypes=[],
      pageNumber = 1,
      isLoadMore = false,
    }) => {
      if (pageNumber === 1) {
        setIsLoading(true);
      }

      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append("status", "true");

        if (brandIds && brandIds.length > 0) {
          params.append("brandIds", brandIds.join(","));
        }
        if (minPrice && minPrice !== 0 && minPrice !== "0")
          params.append("minPrice", minPrice);
        if (maxPrice && maxPrice !== 10000 && maxPrice !== "10000")
          params.append("maxPrice", maxPrice);
        if (sort) params.append("sort", sort);
        if (superCatId) params.append("superCatId", superCatId);
        if (subCatId) params.append("subCatId", subCatId);
        if (catId) params.append("catId", catId);
        if (sizes && sizes.length > 0) {
          params.append("size", sizes.join(","));
        }
        if (colors && colors.length > 0) {
          params.append("color", colors.join(","));
        }
        if (collectionId) params.append("collectionId", collectionId);
        
        if (key) params.append("key", key);
        if(fits && fits.length>0){
          params.append("fit",fits.join(","));
        }
        if(clothingTypes && clothingTypes.length>0){
          params.append("clothingType",clothingTypes.join(","));
        }

        // Add page parameter
        params.append("page", pageNumber);

        // const response = await axiosHttp.post(
        //   `/filter-products?${params.toString()}`,
        // );
        const response = await axiosHttp.get(
          `/filter-products?${params.toString()}`,
        );

        if (response?.status === 200) {
          //const newProducts = response?.data?.data?.products || [];
          const newProducts = response?.data?.data || [];
          const pagination = response?.data?.data?.pagination || {};

          if (isLoadMore) {
            // Append new products to existing ones
            setProducts((prevProducts) => [...prevProducts, ...newProducts]);
          } else {
            // First load - replace products
            setProducts(newProducts);
          }

          // Update pagination state
          setPage(pagination.currentPage || pageNumber);
          setTotalPages(pagination.totalPages || 0);
          setHasMore(pagination.currentPage < pagination.totalPages);

          // Store current filters for loadMore
          if (!isLoadMore) {
            currentFiltersRef.current = {
              brandIds,
              minPrice,
              maxPrice,
              sort,
              superCatId,
              subCatId,
              catId,
              sizes,
              colors,
              collectionId,
              key,
              fits,
              clothingTypes,
            };
          }

          return newProducts;
        } else {
          if (!isLoadMore) {
            setProducts([]);
          }
          setHasMore(false);
          return [];
        }
      } catch (error) {
        if (!isLoadMore) {
          setProducts([]);
        }
        setHasMore(false);
        return [];
      } finally {
        if (pageNumber === 1) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (hasMore && page < totalPages) {
      applyFilters({
        ...currentFiltersRef.current,
        pageNumber: page + 1,
        isLoadMore: true,
      });
    }
  }, [page, hasMore, totalPages, applyFilters]);

  return {
    products,
    isLoading,
    hasMore,
    applyFilters,
    loadMore,
  };
};

export default useUnifiedFilter;
