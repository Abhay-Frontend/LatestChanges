import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ import router

const WishlistCard = ({
  id, // productId
  imageSrc,
  imageAlt,
  rating,
  reviewCount,
  brandName,
  productName,
  currentPrice,
  originalPrice,
  onDelete,
  slug,
  shopifyHandles,
}) => {
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const router = useRouter(); // ✅ initialize router
  const productLink = slug || shopifyHandles || id;

  // ✅ Calculate discount only if original price > current price
  const discount =
    originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  const handleDelete = () => {
    // ✅ META PIXEL: Track removal (Custom Event)
    // This helps you analyze why people are dropping items
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq('trackCustom', 'RemoveFromWishlist', {
        content_ids: [id.toString()],
        content_name: productName,
        value: currentPrice,
        currency: 'INR'
      });
    }
    onDelete(id);
    setShowDeleteOverlay(false);
  };

  // ✅ Navigate to product details page
  const handleViewProduct = () => {
    if (id) {
      // ✅ META PIXEL: Track clicking to view details from wishlist
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_ids: [id.toString()],
          content_name: productName,
          content_type: 'product',
          value: currentPrice,
          currency: 'INR'
        });
      }
      localStorage.setItem("ProductId", id);
      router.push(`/products/${productLink}`);
    }
  };

  return (
    <div className="relative overflow-hidden w-full bg-white flex flex-col">
      {/* Product Image */}
      <div className="relative w-full aspect-[4/5] px-4 bg-stone-200 rounded-xl overflow-hidden flex items-center justify-center">
        <Image
          src={imageSrc || "/placeholder.png"}
          alt={imageAlt || "Product Image"}
          width={500}
          height={500}
          className="w-full h-full object-contain"
        />

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteOverlay(true)}
          className="absolute cursor-pointer top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Product Details */}
      <div className="p-1 flex-1 flex flex-col">
        {/* Rating */}
        {Number(rating) > 0 && Number(reviewCount) > 0 && (
          <div className="flex gap-1 md:gap-2 mb-1">
            <span className="text-xs md:text-sm font-semibold">{rating}</span>
            <svg
              className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <span className="text-xs md:text-sm text-gray-500">
              | {reviewCount}
            </span>
          </div>
        )}

        <h3 className="text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-1 line-clamp-1">
          {brandName}
        </h3>
        <p className="text-xs md:text-sm lg:text-base text-black font-semibold mb-2 line-clamp-2">
          {productName?.split(" ").length > 5
            ? productName.split(" ").slice(0, 4).join(" ") + "..."
            : productName}
        </p>

        <div className="flex flex-wrap gap-1 md:gap-2 mb-3 items-center">
          <span className="text-sm md:text-base lg:text-lg font-bold text-gray-900">
            Rs. {currentPrice}
          </span>
          {originalPrice > currentPrice && (
            <>
              <span className="text-xs md:text-sm text-gray-400 line-through">
                Rs. {originalPrice}
              </span>
              <span className="text-xs md:text-sm font-semibold text-[#9c90ff]">
                ({discount}%)
              </span>
            </>
          )}
        </div>

        {/* ✅ View Product Button at bottom */}
        <div className="mt-auto">
          <button
            onClick={handleViewProduct} // 👈 navigate
            className="w-full cursor-pointer py-1.5 md:py-2 text-xs md:text-sm lg:text-base border-2 border-gray-900 text-gray-900 font-semibold rounded hover:bg-gray-100 transition"
          >
            View Product
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteOverlay && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-transparent text-center px-4">
            <h2 className="text-lg font-bold text-white mb-2">
              REMOVE THIS ITEM?
            </h2>
            <p className="text-sm text-white/90 mb-4">
              This action can't be undone.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowDeleteOverlay(false)}
                className="px-4 py-1 text-white cursor-pointer text-sm font-semibold rounded hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1 border-2 cursor-pointer text-sm border-white text-white font-semibold rounded hover:bg-white hover:text-black transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistCard;
