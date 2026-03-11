"use client";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { openWishlistModal } from "@/redux/slices/loginmodalSlice";
import CreateBoardModal from "./WishlistBoardModal";
import useAddProductToCart from "@/hooks/useAddProductToCart";
import { addToCart } from "@/redux/slices/cartSlice";
import { setBuyNowProduct } from "@/redux/slices/buyNowSlice";
import { useRouter } from "next/navigation";
import { text } from "@fortawesome/fontawesome-svg-core";

const ProductActions = ({
  onAddToWishlist,
  productData,
  productId,
  quantity = 1,
  isInStock = true,
  onMessage = null,
  selectedVariant = null,
  sizes = [],
}) => {
  const [showModal, setShowModal] = useState(false);
  const dispatch = useDispatch();
  const { addProductToCart, loading } = useAddProductToCart();
  const router = useRouter();

  const handleWishlistClick = () => {
    setShowModal(true);
    dispatch(openWishlistModal());

    // ✅ Meta Pixel for Wishlist
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "AddToWishlist", {
        content_ids: [selectedVariant?.id?.toString() || productData?.variants?.[0]?.id?.toString() || productData.id],
        content_name: productData.title,
        content_type: "product",
        value: parseFloat(selectedVariant?.price || productData.variants?.[0]?.price || 0),
        currency: "INR",
      });
    }
    if (onAddToWishlist) onAddToWishlist();
  };

  const handleAddToBag = async () => {
    // Check if size selection is required but not made
    const hasSizes = sizes && sizes.length > 0;
    if (hasSizes && !selectedVariant) {
      if (onMessage) onMessage({ type: "error", text: "Please select a size" });
      return; // Exit early - don't call API or dispatch to Redux
    }

    if (!isInStock) {
      if (onMessage) onMessage({ type: "error", text: "Out of Stock" });
      return;
    }


    // ADD THIS: Clear Buy Now state when adding to cart
    dispatch(setBuyNowProduct(null));

    const result = await addProductToCart(productId, quantity);

    const variantId = localStorage.getItem("selectedVariantId");

    // Only dispatch to Redux if API call was successful
    if (result.success) {
      dispatch(addToCart({ product: productData, variantId }));
      if (onMessage) onMessage({ type: "success", text: result.message });

      // ✅ Fire the Meta Pixel event here
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_ids: [selectedVariant?.id?.toString() || variantId],
          content_name: productData.title,
          content_type: 'product',
          value: parseFloat(selectedVariant?.price || productData.variants?.[0]?.price || 0),
          currency: 'INR',
        });
      }
    } else {
      if (onMessage) onMessage({ type: "error", text: result.message });
    }
  };
  const handleBuyNow = async () => {
    // 1. Validation
    if (!selectedVariant) {
      if (onMessage) onMessage({ type: "error", text: "Please select a size" });
      return;
    }

    try {
      // 2. STEP 1: Initiate Checkout (Direct Mode)
      // This follows your guide: POST /checkout/initiate
      const response = await axiosHttp.post("/checkout/initiate", {
        mode: "direct",
        productId: productId,
        variantId: selectedVariant.id,
        quantity: quantity,
      });

      if (response.data?.success) {
        const { checkoutSessionId } = response.data.data;

        // 3. Store the session ID (Required for Step 2: Address)
        localStorage.setItem("checkoutSessionId", checkoutSessionId);

        // ✅ Meta Pixel for InitiateCheckout
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "InitiateCheckout", {
            content_ids: [selectedVariant.id.toString()],
            content_name: productData.title,
            content_type: "product",
            value: parseFloat(selectedVariant.price),
            currency: "INR",
          });
        }

        // 4. Redirect to Step 2 (The Address page we already fixed)
        router.push("/checkout/address");
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        if (onMessage) onMessage({ type: "error", text: error.response.data.message });
      } else {
        if (onMessage) onMessage({ type: "error", text: "Could not start checkout. Try again." });
      }
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleAddToBag}
          disabled={loading || !isInStock}
          className="w-full cursor-pointer bg-black text-white py-3.5 rounded font-bold text-sm   shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Adding..." : !isInStock ? "Out of Stock" : "Add to Bag"}
        </button>

        <button
          onClick={handleWishlistClick}
          className="w-full cursor-pointer border border-gray-300 text-gray-900 py-3.5 rounded font-bold text-sm hover:border-gray-400 transition-colors"
        >
          WISHLIST
        </button>

        <button
          onClick={handleBuyNow}
          className="w-full cursor-pointer border border-gray-300 text-gray-900 py-3.5 rounded font-bold text-sm hover:border-gray-400 transition-colors">
          BUY NOW
        </button>
      </div>

      {showModal && (
        <CreateBoardModal
          productData={productData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ProductActions;
