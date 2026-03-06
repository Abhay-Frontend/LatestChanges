import Image from "next/image";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  openProductViewModal,
  openWishlistModal,
} from "@/redux/slices/loginmodalSlice";
import WishlistBoardModal from "../WishlistBoardModal";
import Link from "next/link";
import { Heart } from "lucide-react";

const NewInCard = ({
  image,
  title,
  brand,
  price,
  originalPrice,
  discount,
  id,
  product,
}) => {
  const dispatch = useDispatch();
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const productLink = product?.slug || product?.shopifyHandles || id;

  const handlePreviewClick = (e) => {
    e.preventDefault();
    dispatch(openProductViewModal(product));
  };

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowWishlistModal(true);
    dispatch(openWishlistModal());
  };

  const sellingPrice = Number(price);
  const mrpValue = Number(product?.mrp ?? originalPrice ?? 0);

  const showOriginalPrice =
    mrpValue > 0 && sellingPrice > 0 && mrpValue > sellingPrice;

  const discountPercentage = showOriginalPrice
    ? Math.round(((mrpValue - sellingPrice) / mrpValue) * 100)
    : 0;

  const productData = {
    id,
    imageUrls: [image],
    title,
    brand: product?.brand?.name,
    rating: product?.rating || 0,
    reviewCount: product?.reviewCount || 0,
    basePrice: sellingPrice,
    mrp: showOriginalPrice ? mrpValue : null,
    discountPercentage: showOriginalPrice ? discountPercentage : 0,
  };

  return (
    <>
      <Link
        href={`/products/${productLink}`}
       
        onClick={() => localStorage.setItem("ProductId", id)}
      >
        <div className="w-full rounded-xl inline-flex flex-col gap-2 sm:gap-2.5 overflow-hidden cursor-pointer">
          {/* Image */}
          <div className="relative h-48 sm:h-56 md:h-[150px] bg-stone-50 rounded-xl overflow-hidden flex items-center justify-center">
            {image ? (
              <Image
                src={image}
                alt={title}
                width={120}
                height={120}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-300" />
            )}

            {/* Hover Preview */}
            <button
              onClick={handlePreviewClick}
              className="absolute left-1/2 -translate-x-1/2 bottom-2 sm:bottom-3 w-[calc(100%-16px)] sm:w-[calc(100%-12px)] h-9 sm:h-10 md:h-11 py-2 bg-stone-50 rounded-lg flex justify-center items-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer hover:bg-stone-100 cursor-pointer"
            >
              <span className="text-stone-950 text-xs sm:text-sm font-medium">
                Product Preview
              </span>
            </button>
          </div>

          {/* Details */}
          <div className="px-2 sm:px-3 md:px-3 pb-2 sm:pb-3 flex flex-col gap-1.5">
            <div className="py-1.5 sm:py-2 flex flex-col gap-1.5 sm:gap-2">
              <div className="flex gap-2 sm:gap-2.5">
                <div className="flex-1 flex flex-col gap-1">
                  <h3 className="text-xs sm:text-sm md:text-[15px] font-[600] uppercase text-[#0F0F0F]">
                    {title.length > 20 ? title.substring(0, 20) + "..." : title}
                  </h3>
                  <p className="text-xs sm:text-xs md:text-[13px] uppercase font-[400] text-[#0F0F0F]">
                    {brand}
                  </p>
                </div>

                <button
                  onClick={handleLikeClick}
                  className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform cursor-pointer flex-shrink-0"
                >
                  <Heart size={16} className="sm:block hidden text-black" />
                  <Heart size={14} className="sm:hidden text-black" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {/* Selling Price */}
                <span className="text-xs sm:text-[13px] md:text-[15px] font-[500] text-[#292929] uppercase">
                  ₹{sellingPrice}
                </span>

                {/* Original Price (ONLY if mrp valid) */}
                {showOriginalPrice && (
                  <span className="text-xs sm:text-sm md:text-base text-black font-[500] opacity-60 line-through uppercase">
                    ₹{mrpValue}
                  </span>
                )}

                {/* Discount */}
                {showOriginalPrice && (
                  <span className="text-xs sm:text-sm font-medium text-[#9c90ff] uppercase">
                    ({discountPercentage}% OFF)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <WishlistBoardModal
          productData={productData}
          onClose={() => setShowWishlistModal(false)}
        />
      )}
    </>
  );
};

export default NewInCard;
