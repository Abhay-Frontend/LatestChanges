"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter } from "lucide-react";

import FilterSidebar from "@/components/FilterSidebar";
import SortSelector from "@/components/SortSelector";
import ProductGrid from "@/components/ProductGrid";

import useFilterMetadata from "@/hooks/useFilterMetadata";
import useUnifiedFilter from "@/hooks/useUnifiedFilter";
import useProducts from "@/hooks/useProducts";

const ShopByCategoriesPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ===== URL PARAMETERS =====
  const subCategoryId = searchParams.get("subCatId");
  const superCatId = searchParams.get("superCatId");
  const catId = searchParams.get("catId");
  const collectionId = searchParams.get("collectionId");
  const searchQuery = searchParams.get("key")
    ? decodeURIComponent(searchParams.get("key"))
    : null;

  // ===== FILTER STATE =====
  const [selectedBrands, setSelectedBrands] = useState(() => {
    const brandIds = searchParams.get("brandIds");
    return brandIds ? brandIds.split(",").map(Number) : [];
  });
  const [selectedSuperCategory, setSelectedSuperCategory] = useState(
    superCatId ? Number(superCatId) : null,
  );
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get("minPrice") || "0",
    max: searchParams.get("maxPrice") || "10000",
  });

  const [selectedSizes, setSelectedSizes] = useState(() => {
    const sizes = searchParams.get("size");
    return sizes ? sizes.split(",") : [];
  }); // stores actual size values like "S", "M"
  const [selectedColors, setSelectedColors] = useState(() => {
    const colors = searchParams.get("color");
    return colors ? colors.split(",") : [];
  }); // stores actual color values like "Black", "Red"
  const [selectedFits, setSelectedFits] = useState(() => {
  const fits = searchParams.get("fit");
  return fits ? fits.split(",") : [];
  });
  const [ selectedClothingType, setSelectedClothingTypes] = useState([]);


  // ===== EXPAND / COLLAPSE UI STATE =====
  const [expandedBrands, setExpandedBrands] = useState(false);
  const [expandedSizes, setExpandedSizes] = useState(false);
  const [expandedColors, setExpandedColors] = useState(false);
  const [ expandedFits, setExpandedFits ] = useState(false);
  const [ expandedClothingTypes, setExpandedClothingTypes ] = useState(false);

  // ===== SORT STATE =====
  const [selectedSort, setSelectedSort] = useState(
    searchParams.get("sort") || "",
  );

  // ===== FILTER PANEL STATE =====
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ===== FILTER METADATA =====
  const {
    brands,
    sizes,
    colors,
    fits =[],
    clothingTypes =[],
    loading: filterMetaLoading,
  } = useFilterMetadata({
    superCatId:
      selectedSuperCategory ?? (superCatId ? Number(superCatId) : null),
    catId: catId ? Number(catId) : null,
    subCatId: subCategoryId ? Number(subCategoryId) : null,
    collectionId: collectionId ? Number(collectionId) : null,
    brandIds: selectedBrands,
  });

  // ===== SUPER CATEGORIES =====
  const superCategories = [
    { id: 1, name: "Men" },
    { id: 2, name: "Women" },
    { id: 3, name: "Accessories" },
  ];

  // ===== CHECK IF ANY FILTERS ARE APPLIED =====
  const hasFiltersApplied = () =>
    selectedBrands.length > 0 ||
    selectedSuperCategory ||
    priceRange.min !== "0" ||
    priceRange.max !== "10000" ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedFits.length>0||
    selectedClothingType.length>0||
    selectedSort ||
    subCategoryId ||
    catId ||
    collectionId ||
    searchQuery;

  // ===== FILTERED PRODUCTS =====
  const {
    products: filteredProducts,
    isLoading: isFilterLoading,
    hasMore: hasMoreFiltered,
    applyFilters,
    loadMore: loadMoreFiltered,
  } = useUnifiedFilter();

  // ===== PAGINATED PRODUCTS =====
  const {
    products: paginatedProducts,
    loading: isPageLoading,
    hasMore: hasMorePaginated,
    loadMore: loadMorePaginated,
  } = useProducts(hasFiltersApplied() ? null : "");

  const products = hasFiltersApplied() ? filteredProducts : paginatedProducts;
  const isLoading = hasFiltersApplied() ? isFilterLoading : isPageLoading;
  const hasMore = hasFiltersApplied() ? hasMoreFiltered : hasMorePaginated;
  const loadMore = hasFiltersApplied() ? loadMoreFiltered : loadMorePaginated;

  // ===== AVAILABLE SIZES & COLORS FROM METADATA =====
  const availableSizes = sizes || [];
  const availableColors = colors || [];

  // ===== APPLY FILTERS ON CHANGE =====
  // useEffect(() => {
  //   //if (!hasFiltersApplied()) return;

  //   applyFilters({
  //     brandIds: selectedBrands,
  //     minPrice: priceRange.min,
  //     maxPrice: priceRange.max,
  //     sort: selectedSort,
  //     superCatId: selectedSuperCategory,
  //     subCatId: subCategoryId ? Number(subCategoryId) : null,
  //     catId: catId ? Number(catId) : null,
  //     sizes: selectedSizes,
  //     colors: selectedColors,
  //     collectionId: collectionId ? Number(collectionId) : null,
  //     fits: selectedFits,
  //     clothingTypes:selectedClothingType,
  //     key: searchQuery,
  //     pageNumber:1,
  //     isLoadMore:false,
  //   });
  // }, [

  //   selectedBrands,
  //   priceRange,
  //   selectedSort,
  //   selectedSuperCategory,
  //   subCategoryId,
  //   catId,
  //   selectedSizes,
  //   selectedColors,
  //   collectionId,
  //   selectedFits,
  //   selectedClothingType,
  //   searchQuery,
  //   applyFilters,
  // ]);
  useEffect(() => {
    if (!hasFiltersApplied()) return;

    applyFilters({
      brandIds: selectedBrands,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: selectedSort,
      superCatId: selectedSuperCategory,
      subCatId: subCategoryId ? Number(subCategoryId) : null,
      catId: catId ? Number(catId) : null,
      sizes: selectedSizes,
      colors: selectedColors,
      collectionId: collectionId ? Number(collectionId) : null,
      fits: selectedFits,
      clothingTypes:selectedClothingType,
      key: searchQuery,
    });
  }, [

    selectedBrands,
    priceRange,
    selectedSort,
    selectedSuperCategory,
    subCategoryId,
    catId,
    selectedSizes,
    selectedColors,
    collectionId,
    selectedFits,
    selectedClothingType,
    searchQuery,
    applyFilters,
  ]);

  // ===== HANDLERS =====
  const toggleSelection = (setter, value) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    if (selectedBrands.length) params.set("brandIds", selectedBrands.join(","));
    if (priceRange.min !== "0") params.set("minPrice", priceRange.min);
    if (priceRange.max !== "10000") params.set("maxPrice", priceRange.max);
    if (selectedSuperCategory) params.set("superCatId", selectedSuperCategory);
    if (selectedSizes.length) params.set("size", selectedSizes.join(","));
    if (selectedColors.length) params.set("color", selectedColors.join(","));
    if (selectedSort) params.set("sort", selectedSort);
    if (subCategoryId) params.set("subCatId", subCategoryId);
    if (catId) params.set("catId", catId);
    if (collectionId) params.set("collectionId", collectionId);
    if (selectedFits.length) params.set("fit", selectedFits.join(","));
    if (selectedClothingType.length) params.set("clothingType", selectedClothingType.join(","));
    if (searchQuery) params.set("key", encodeURIComponent(searchQuery));

    router.push(`/products?${params.toString()}`);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedBrands([]);
    setSelectedSuperCategory(null);
    setPriceRange({ min: "0", max: "10000" });
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedFits([]);
    setSelectedClothingTypes([]);
    setSelectedSort("");
    router.push("/products");
  };

  return (
    <div className="min-h-screen bg-white relative mt-[130px]">
      {/* MOBILE FILTER BUTTON */}
      <button
        className="lg:hidden fixed bottom-4 left-4 z-10 bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
        onClick={() => setIsFilterOpen(true)}
      >
        <Filter size={18} /> Filters
      </button>

      <div className="w-full md:px-[100px] md:py-0 px-4 p-4 md:p-12 mb-4 flex">
        <FilterSidebar
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          brands={brands}
          selectedBrands={selectedBrands}
          toggleBrandSelection={(id) => toggleSelection(setSelectedBrands, id)}
          expandedBrands={expandedBrands}
          setExpandedBrands={setExpandedBrands}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          superCategories={superCategories}
          selectedSuperCategory={selectedSuperCategory}
          onSuperCategoryChange={setSelectedSuperCategory}
          sizes={availableSizes}
          selectedSizes={selectedSizes}
          toggleSizeSelection={(size) =>
            toggleSelection(setSelectedSizes, size)
          }
          expandedSizes={expandedSizes}
          setExpandedSizes={setExpandedSizes}
          colors={availableColors}
          selectedColors={selectedColors}
          toggleColorSelection={(color) =>
            toggleSelection(setSelectedColors, color)
          }
          expandedColors={expandedColors}
          setExpandedColors={setExpandedColors}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          isLoading={isLoading || filterMetaLoading}
        />

        <div className="flex-1 p-6">
          <SortSelector
            searchQuery={searchQuery}
            selectedSort={selectedSort}
            onSortChange={(e) => setSelectedSort(e.target.value)}
            isSortLoading={isLoading}
          />

          <ProductGrid
            products={products}
            isLoading={isLoading}
            isFilterApplied={hasFiltersApplied()}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onBrowseAll={() => router.push("/products")}
          />
        </div>
      </div>
    </div>
  );
};

export default ShopByCategoriesPage;
