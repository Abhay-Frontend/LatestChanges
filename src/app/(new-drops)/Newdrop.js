"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import NewInCard from "@/components/homepage/NewInCard";
import useProducts from "@/hooks/useProducts";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ITEMS_PER_PAGE = 4;
const ITEMS_PER_ROW = 2;

const NewestAtLafetch = () => {
  const { products = [] } = useProducts();
  const [currentPage, setCurrentPage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const isModalOpen = useSelector((state) => state.modal.productViewModal);
  const isWishlistModalOpen = useSelector((state) => state.modal.wishlistModal);

  //const topProducts = products.slice(0, 12):[];
  const topProducts = Array.isArray(products) ? products.slice(0, 12) : [];
  const totalPages = Math.ceil(topProducts.length / ITEMS_PER_PAGE);

  // Auto-rotate products every 5 seconds (only when modals are NOT open and not hovering)
  useEffect(() => {
    if (!totalPages || isModalOpen || isWishlistModalOpen || isHovering) return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPages, isModalOpen, isWishlistModalOpen, isHovering]);

  // Products for current page
  const currentProducts = useMemo(() => {
    const startIdx = currentPage * ITEMS_PER_PAGE;
    return topProducts.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [currentPage, topProducts]);

  // Split into rows (2 per row)
  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < currentProducts.length; i += ITEMS_PER_ROW) {
      result.push(currentProducts.slice(i, i + ITEMS_PER_ROW));
    }
    return result;
  }, [currentProducts]);

  const handleLike = (productId) => {};

  return (
    <div className="w-full p-[24px] py-6 sm:py-8 bg-white flex flex-col gap-6 sm:gap-8 md:gap-10 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10 ">
        <div
          className="flex-1 h-1 bg-stone-100/90 overflow-hidden relative cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div
            className="h-full bg-stone-950 transition-all duration-500"
            style={{
              width: `${100 / totalPages}%`,
              transform: `translateX(${currentPage * 100}%)`,
            }}
          />
        </div>

        <h2 className="w-full md:w-[600px] text-left md:text-right text-2xl  md:text-[36px] font-semibold uppercase text-[#0F0F0F]">
          What's New at Lafetch
        </h2>
      </div>

      {/* Content */}
      <div className=" max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-[100px]">
        {/* Products */}
        <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-7">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex flex-row gap-4 sm:gap-6 md:gap-7 lg:gap-9"
            >
              {row.map((product) => (
                <div key={product.id} className="w-full sm:flex-1">
                  <NewInCard
                    id={product.id}
                    product={product}
                    image={product.imageUrls?.[0]}
                    title={product.title}
                    brand={product?.brand?.name}
                    price={product.basePrice}
                    originalPrice={product.mrp}
                    discount={product.discount || ""}
                    onLike={() => handleLike(product.id)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right Section - Static */}
        <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-7">
          <div className="h-48 sm:h-72 md:h-[280px] rounded-xl md:rounded-2xl bg-stone-200 overflow-hidden">
            <video
              src="/videos/newin.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-fill"
            />
          </div>

          <div className="relative h-50 sm:h-44  md:h-[220px] rounded-xl md:rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[#e7e7e6] rounded-xl md:rounded-2xl" />
            <div className="absolute inset-0 left-4 sm:left-5 md:left-6 lg:left-7 top-4 sm:top-5 md:top-6  right-4 sm:right-5 md:right-6 lg:right-7 flex flex-col gap-3 sm:gap-3 md:gap-4 lg:gap-5">
              <div>
                <h3 className="text-lg   md:text-[23px] font-[550] text-[#0F0F0F] uppercase">
                  Fresh Fits Just Landed
                </h3>
                <p className="text-xs  md:text-[13px] font-[500] text-[#0F0F0FCC] leading-5 sm:leading-6 md:leading-7 lg:leading-[24px]">
                  Explore our curated picks for the season. From trend-led
                  silhouettes to forever classics -your next favorite starts
                  here.
                </p>
              </div>

              <Link
                href="/products"
                className="px-6 sm:px-7 md:px-8 lg:px-10 py-2 sm:py-3 md:py-4 max-w-[200px] text-[#0F0F0F] text-sm md:text-[14px]  font-[600] cursor-pointer rounded-full outline outline-2 outline-stone-950 hover:bg-stone-950 hover:text-white transition w-fit flex items-center gap-2 sm:gap-3 group uppercase"
              >
                View All
                <ArrowRight className="text-black group-hover:text-white rotate-[-45deg]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewestAtLafetch;
