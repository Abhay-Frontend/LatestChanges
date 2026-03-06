import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import CreateBoardModal from "./WishlistBoardModal";
import { useDispatch } from "react-redux";
import { openWishlistModal } from "@/redux/slices/loginmodalSlice";
import Link from "next/link";
import Image from "next/image";

const ListingCard = ({
  imageUrls,
  title,
  brand,
  rating,
  reviewCount,
  basePrice,
  mrp,
  discountPercentage,
  id,
  slug,
  shopifyHandles,
}) => {
  const [showModal, setShowModal] = useState(false); // Add this state
  const dispatch = useDispatch();
  const productLink = slug || shopifyHandles || id;

  const handleWishlistClick = () => {
    setShowModal(true); // Set this card's modal to show
    dispatch(openWishlistModal());
  };

  const productData = {
    id,
    imageUrls,
    title,
    brand,
    rating,
    reviewCount,
    basePrice,
    mrp,
    discountPercentage,
  };

  return (
    <>
      <div className="relative overflow-hidden w-full flex flex-col">
        {/* Product Image with Link */}
        <Link
          href={`/products/${productLink}`}
         // target="_blank"
        //  rel="noopener noreferrer"
          onClick={() => localStorage.setItem("ProductId", id)}
        >
          <div className="relative bg-gray-50 overflow-hidden group flex-shrink-0 w-full aspect-[4/5] cursor-pointer px-4 flex items-center justify-center">
            {imageUrls?.[0] ? (
              <Image
                src={imageUrls[0]}
                alt={title || "Product"}
                width={400}
                height={500}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-300" />
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-3 justify-between">
          {/* Rating */}
          {rating && Number(rating) > 0 ? (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-900">
                  {rating}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xs ${
                        i < Math.floor(rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {reviewCount && Number(reviewCount) > 0 && (
                <span className="text-xs text-gray-500">| {reviewCount}</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-1"></p>
          )}

          {/* Brand and Wishlist */}
          {brand && (
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                {brand}
              </p>

              {/* Wishlist Icon */}
              <button
                onClick={handleWishlistClick}
                className="w-8 h-8 rounded-full  flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 flex-shrink-0"
              >
                <Heart
                  size={16}
                  className={`text-black transition-colors duration-200 cursor-pointer`}
                />
              </button>
            </div>
          )}

          {/* Title */}
          <h3
            className="text-sm font-medium text-gray-900 mb-3 leading-tight"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title || "Product Title"}
          </h3>

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-base font-bold text-gray-900">
                Rs. {basePrice}
              </span>

              {mrp > basePrice && mrp > 0 && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    Rs. {mrp}
                  </span>

                  {discountPercentage > 0 && (
                    <span className="text-xs text-[#ac9ffc] font-medium">
                      ({discountPercentage}% OFF)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Only render modal if showModal is true for this card */}
      {showModal && (
        <CreateBoardModal
          productData={productData}
          onClose={() => {
            setShowModal(false);
          }}
        />
      )}
    </>
  );
};

export default ListingCard;
