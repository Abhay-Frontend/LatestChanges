// ProductCard.jsx
import Image from "next/image";
import Link from "next/link";
import React, { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { useDispatch } from "react-redux";
import { openWishlistModal } from "@/redux/slices/loginmodalSlice";
import WishlistBoardModal from "./WishlistBoardModal";

const BrandProductCard = ({ image, title, price, productId, mrp, slug, shopifyHandles }) => {
  const dispatch = useDispatch();
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  const handleLike = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowWishlistModal(true);
      dispatch(openWishlistModal());
    },
    [dispatch],
  );

  const discountPercentage =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="bg-white overflow-hidden  transition-shadow">
      <Link href={`/products/${slug || shopifyHandles || productId}`}>
        <div className="aspect-[4/5] overflow-hidden px-4 bg-stone-200 rounded-xl flex items-center justify-center">
          <Image
            src={image}
            alt={title}
            width={500}
            height={500}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-3">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm text-gray-800 line-clamp-2 flex-1">
              {title}
            </h3>
            <button onClick={handleLike} className="ml-2 cursor-pointer">
              <Heart className="w-5 h-5 text-black" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm md:text-lg font-semibold text-gray-900">
              ₹{price}
            </p>
            {mrp > price && (
              <>
                <p className="text-sm text-gray-500 line-through">₹{mrp}</p>
                <p className=" text-[10px] md:text-sm text-[#9c90ff] font-medium">
                  ({Math.round(((mrp - price) / mrp) * 100)}% OFF)
                </p>
              </>
            )}
          </div>
        </div>
      </Link>

      {showWishlistModal && (
        <WishlistBoardModal
          productData={{
            id: productId,
            imageUrls: [image],
            title: title,
            brand: "",
            basePrice: price,
            mrp: mrp > price ? mrp : null,
            discountPercentage,
          }}
          onClose={() => setShowWishlistModal(false)}
        />
      )}
    </div>
  );
};

export default BrandProductCard;
