import { useState } from "react";
import { Eye, ShoppingBag, Heart } from "lucide-react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import {
  openProductViewModal,
  openWishlistModal,
} from "@/redux/slices/loginmodalSlice";
import WishlistBoardModal from "./WishlistBoardModal";
import Link from "next/link";

const ProductCard = ({ images, title, price, id, product, brand, mrp }) => {
  const dispatch = useDispatch();
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  const handleEyeClick = () => {
    dispatch(openProductViewModal(product)); // opens product view modal
  };

  const handleWishlistClick = () => {
    setShowWishlistModal(true); // open modal locally
    dispatch(openWishlistModal()); // update redux for global modal state
  };

  const productLink = product?.slug || product?.shopifyHandles || id;
    imageUrls: images,
    title,
    brand: product?.brand?.name || "",
    rating: product?.rating || 0,
    reviewCount: product?.reviewCount || 0,
    basePrice: price,
    mrp: product?.mrp || 0,
    discountPercentage: product?.discountPercentage || 0,
  };

  return (
    <>
      <div className="relative bg-white overflow-hidden w-[160px] h-[400px] md:w-[300px] md:h-[500px]">
        {/* Product Image */}
        <div className="relative bg-gray-50 overflow-hidden group w-[160px] h-[240px] md:w-[300px] md:h-[380px]">
          <Link
            href={`/products/${productLink}`}
           // target="_blank"
           // rel="noopener noreferrer"
            onClick={() => localStorage.setItem("ProductId", id)}
          >
            <Image
              src={
                images && images.length > 0
                  ? images[0]
                  : "https://cdn.shopify.com/s/files/1/0553/6186/3863/products/0I1A6958copy-pichi.jpg?v=1617717071"
              }
              alt={title || "product-img"}
              fill
              className="object-fill transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Action Icons */}
          <div className="absolute top-4 right-2 flex flex-col gap-2 sm:gap-3 md:gap-4">
            {/* Eye Icon */}
            <button
              onClick={handleEyeClick}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
            >
              <Eye size={18} className="text-gray-700" />
            </button>

            {/* Heart Icon (Wishlist) */}
            <button
              onClick={handleWishlistClick}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
            >
              <Heart size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="px-6 py-4 text-center" style={{ height: "80px" }}>
          <h3 className="text-sm md:text-md  text-black mb-1 font-bold">
            {title.length > 20 ? title.substring(0, 20) + "..." : title}
          </h3>
          <p className="text-sm  text-gray-900 mb-1 font-myfont">{brand}</p>

          <div className="flex flex-col items-center gap-1">
            <p className="text-black text-sm font-bold">Rs. {price}</p>
            {mrp && mrp > price && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600 text-sm line-through">
                  Rs. {mrp}
                </span>
                <span className="text-green-600 text-xs font-bold">
                  {Math.round(((mrp - price) / mrp) * 100)}% off
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default ProductCard;
