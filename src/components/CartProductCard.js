import React, { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const CartProductCard = ({
  product,
  onRemove,
  onQuantityChange,
  onSizeChange,
  isSelected,
  onToggleSelect,
}) => {
  const [showStockMessage, setShowStockMessage] = useState(false);

  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  // Increment Quantity
  const handleIncrease = () => {
    const availableStock = product.availableStock || 50;
    if (product.quantity < availableStock) {
      onQuantityChange(product.cartItemId, product.quantity + 1);
      setShowStockMessage(false);
    } else {
      // Show stock limit message
      setShowStockMessage(true);
      setTimeout(() => setShowStockMessage(false), 3000);
    }
  };

  // Decrement Quantity
  const handleDecrease = () => {
    if (product.quantity > 1) {
      onQuantityChange(product.cartItemId, product.quantity - 1);
    } else if (product.quantity === 1) {
      // Directly remove item by setting quantity to 0 (bypasses popup)
      onQuantityChange(product.cartItemId, 0);
    }
  };

  return (
    <div className="border-b border-gray-300 p-2 sm:p-4 mb-2 sm:mb-4 pb-4 sm:pb-6">
      <div className="flex gap-2 sm:gap-4">
        {/* Checkbox for Selection */}
        <div className="flex items-start pt-1 sm:pt-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(product.cartItemId)}
            className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer accent-black"
          />
        </div>

        {/* Product Image */}
        <Link
          href={`/products/${product.productSlug || product.productId}`}
          className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] md:w-[150px] md:h-[150px] flex-shrink-0"
        >
          <Image
            src={product.image}
            alt={product.name}
            width={150}
            height={150}
            className="w-full h-full object-fill rounded"
          />
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base md:text-lg text-black truncate sm:whitespace-normal">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-black line-clamp-2 ">
                {product.description}
              </p>
            </div>
            <button
              onClick={() => onRemove(product.productId)}
              className="text-gray-400 hover:text-black cursor-pointer flex-shrink-0 ml-1"
            >
              <X size={16} className="sm:hidden" />
              <X size={20} className="hidden sm:block" />
            </button>
          </div>

          {/* Size and Quantity */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-2 sm:mt-3">
            {/* Size */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-black">
                Size / Color:
              </span>
              <span className="text-black text-xs sm:text-sm font-medium">
                {product.size}
              </span>
            </div>

            {/* Quantity - with + / - */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-black">Qty:</span>
              <div className="flex items-center border rounded px-1 sm:px-2 py-1">
                <button
                  onClick={handleDecrease}
                  className="text-black text-base sm:text-lg font-semibold px-1 sm:px-2 hover:text-[#ac9ffc] active:scale-95 transition-transform cursor-pointer"
                >
                  −
                </button>
                <span className="px-2 sm:px-3 text-xs sm:text-sm text-black select-none min-w-[20px] text-center">
                  {product.quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  className="text-black text-base sm:text-lg font-semibold px-1 sm:px-2 hover:text-[#ac9ffc] active:scale-95 transition-transform cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Stock Availability Message */}
          {showStockMessage && (
            <div className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-[#ac9ffc]  px-2 py-1 rounded">
              Only {product.availableStock || 0} items available in stock
            </div>
          )}

          {/* Price */}
          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1 sm:gap-2">
            <span className=" text-black text-base sm:text-lg">
              Rs. {product.price}
            </span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-black line-through text-xs sm:text-sm">
                  Rs. {product.originalPrice}
                </span>
                <span className="text-[#ac9ffc] text-xs sm:text-sm font-medium">
                  ({discountPercent}% OFF)
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartProductCard;
