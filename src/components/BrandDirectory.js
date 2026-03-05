"use client";
import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import axiosHttp from "@/utils/axioshttp";

const BrandDirectory = ({ brands }) => {
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLetters, setExpandedLetters] = useState({});
  const [expandedBrandId, setExpandedBrandId] = useState(null);
  const [brandPreview, setBrandPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const alphabets = useMemo(() => {
    const letters = new Set(brands.map((b) => b.name[0].toUpperCase()));
    return Array.from(letters).sort();
  }, [brands]);

  const filteredBrands = useMemo(() => {
    let filtered = brands;

    if (searchQuery) {
      filtered = filtered.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const grouped = {};
    filtered.forEach((brand) => {
      const letter = brand.name[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(brand);
    });

    return grouped;
  }, [brands, searchQuery]);

  const toggleExpand = (letter) => {
    setExpandedLetters((prev) => ({
      ...prev,
      [letter]: !prev[letter],
    }));
  };

  const fetchBrandPreview = async (brandId) => {
    if (expandedBrandId === brandId) {
      // Close if already expanded
      setExpandedBrandId(null);
      setBrandPreview(null);
      return;
    }

    setPreviewLoading(true);
    setExpandedBrandId(brandId);
    try {
      const response = await axiosHttp.get(`/view-brand-preview/${brandId}`);
      setBrandPreview(response.data.data);

      // Scroll to the brand card after preview loads
      setTimeout(() => {
        const brandElement = document.querySelector(
          `[data-brand-id="${brandId}"]`
        );
        if (brandElement) {
          const navbarHeight = 200;
          const elementPosition = brandElement.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    } catch (error) {
      setBrandPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const scrollToLetter = (letter) => {
    setSelectedLetter(letter);
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      const navbarHeight = 200; // Adjust this value based on your navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const lettersToRender = useMemo(() => {
    return Object.keys(filteredBrands).sort();
  }, [filteredBrands]);

  const renderBrands = (letter) => {
    const brandsForLetter = filteredBrands[letter] || [];
    const isExpanded = expandedLetters[letter];
    const displayBrands = isExpanded
      ? brandsForLetter
      : brandsForLetter.slice(0, 13);
    const hasMore = brandsForLetter.length > 13;

    // Helper function to calculate discount percentage
    const calculateDiscount = (mrp, basePrice) => {
      if (mrp > basePrice) {
        return Math.round(((mrp - basePrice) / mrp) * 100);
      }
      return 0;
    };

    // Calculate grid columns based on screen size (for positioning preview)
    const getGridColumns = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth >= 1024) return 7; // lg
        if (window.innerWidth >= 768) return 6; // md
        if (window.innerWidth >= 640) return 5; // sm
        return 3; // mobile
      }
      return 7;
    };

    // Find the index of the expanded brand
    const expandedBrandIndex = displayBrands.findIndex(
      (b) => b.id === expandedBrandId
    );

    return (
      <div key={letter} id={`letter-${letter}`} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Left side - Letter */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#988BFF] flex items-center justify-center bg-white">
              <span className="text-xl sm:text-2xl font-semibold text-gray-700 ">
                {letter}
              </span>
            </div>
          </div>

          {/* Right side - Brands Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
              {displayBrands.map((brand, idx) => (
                <React.Fragment key={idx}>
                  <div
                    data-brand-id={brand.id}
                    onClick={() => {
                      if (brand?.id) {
                        localStorage.setItem("brandId", brand.id);
                        fetchBrandPreview(brand.id);
                      }
                    }}
                    className={`relative bg-[#ECECF0] flex flex-col items-center cursor-pointer overflow-hidden group h-full transition-all duration-300 ${
                      expandedBrandId === brand.id
                        ? "ring-2 ring-[#988BFF] shadow-lg"
                        : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="w-full p-6 flex items-center justify-center">
                      <div className="aspect-square w-32 bg-white rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110">
                        {brand.logo ? (
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            width={150}
                            height={150}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-sm font-semibold">
                              {brand.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Spacer pushes name to bottom */}
                    <div className="flex-grow" />

                    {/* Brand Name - always at bottom */}
                    <p className="text-sm text-center text-gray-900 font-normal w-full px-4 py-2 min-h-[40px] flex items-center justify-center transition-colors duration-300 group-hover:bg-[#E0E0E3]">
                      {brand.name}
                    </p>
                  </div>

                  {/* Show preview after the current row */}
                  {expandedBrandId === brand.id && (
                    <div className="col-span-3 sm:col-span-5 md:col-span-6 lg:col-span-7">
                      {/* Brand Preview Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6 shadow-lg">
                        {previewLoading ? (
                          <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#988BFF]"></div>
                          </div>
                        ) : brandPreview ? (
                          <div>
                            {/* Products Grid */}
                            {brandPreview.products &&
                              brandPreview.products.length > 0 && (
                                <div>
                                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                                    Featured Products
                                  </h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    {brandPreview.products
                                      .slice(0, 6)
                                      .map((product) => {
                                        const discount = calculateDiscount(
                                          product.mrp,
                                          product.basePrice
                                        );
                                        return (
                                          <Link
                                            href={`/products/${product.slug || product.id}`}
                                           // target="_blank"
                                           // rel="noopener noreferrer"
                                            key={product.id}
                                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                                          >
                                            {/* Product Image */}
                                            <div className="relative aspect-square bg-gray-100">
                                              {product.imageUrls &&
                                              product.imageUrls[0] ? (
                                                <Image
                                                  src={product.imageUrls[0]}
                                                  alt={product.title}
                                                  fill
                                                  className="object-fill group-hover:scale-105 transition-transform duration-300"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <span className="text-gray-400 text-xs">
                                                    No Image
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-2 sm:p-3">
                                              <h5 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1 sm:mb-2 min-h-[32px] sm:min-h-[40px]">
                                                {product.title}
                                              </h5>
                                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                  ₹{product.basePrice}
                                                </span>
                                                {product.mrp >
                                                  product.basePrice && (
                                                  <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                                                    ₹{product.mrp}
                                                  </span>
                                                )}
                                                {discount > 0 && (
                                                  <span className="text-[10px] sm:text-xs font-semibold text-[#ac9ffc]">
                                                    {discount}% OFF
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </Link>
                                        );
                                      })}
                                  </div>

                                  {/* Explore All Button */}
                                  <div className="flex justify-center">
                                    <Link
                                      href={`/brands/${expandedBrandId}`}
                                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-black text-white text-sm sm:text-base font-medium rounded-lg transition-colors w-full sm:w-auto text-center"
                                    >
                                      Explore All Products
                                    </Link>
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Failed to load brand preview
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* View More / View Less Button */}
              {hasMore && (
                <div
                  onClick={() => toggleExpand(letter)}
                  className="flex flex-col items-center justify-center cursor-pointer aspect-square text-gray-600 hover:text-gray-800 transition-all"
                >
                  <p className="text-xs sm:text-sm font-medium flex items-center gap-1 underline">
                    {isExpanded ? "View Less" : "View More"}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 inline-block" />
                    ) : (
                      <ChevronDown className="w-4 h-4 inline-block" />
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full  p-4 md:px-[100px] md:py-[50px]">
      {/* Top Section - Alphabet Navigation and Search */}
      <div className="mb-8">
        {/* Alphabet Navigation */}
        <div className="flex items-center md:gap-4 gap-3 flex-wrap mb-4">
          {alphabets.map((letter) => (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              className="text-black hover:text-gray-900  md:text-[15px] sm:text-sm transition-colors cursor-pointer"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search For Brands"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border-0 border-b border-gray-300 focus:outline-none focus:border-black transition-colors duration-300 placeholder-gray-400 text-black"
          />
        </div>
      </div>

      {/* Brand Grid by Alphabet */}
      <div>{lettersToRender.map((letter) => renderBrands(letter))}</div>
    </div>
  );
};

export default BrandDirectory;
