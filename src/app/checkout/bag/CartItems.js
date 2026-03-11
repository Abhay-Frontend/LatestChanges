"use client";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import OrderSummary from "@/components/OrderSummary";
import CartProductCard from "@/components/CartProductCard";
import DeleteConfirmModal from "@/components/DeleteModal";

import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";

import useGetCoupons from "@/hooks/useGetCoupons";
import useUpdateCartQuantity from "@/hooks/useUpdateCartQuantity";

import {
  removeFromCart,
  setCartItems,
  setSelectedCartItems,
  updateQuantity,
} from "@/redux/slices/cartSlice";

import { openPhoneAuthModal } from "@/redux/slices/loginmodalSlice";

const ShoppingCart = () => {

  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const products = useSelector((state) => state.cart?.items || []);
  const userInfo = useSelector((state) => state.user?.userInfo);

  const userId = userInfo?.id;

  const getCoupons = useGetCoupons();
  const { updateQuantity: updateCartQuantity } = useUpdateCartQuantity();

  const hasFetched = useRef(false);
  const isInitialMount = useRef(true);

  /* ---------------- FETCH CART ITEMS ---------------- */

  useEffect(() => {

    if (userId && !hasFetched.current) {
      fetchCartItems();
      hasFetched.current = true;
    }

  }, [userId]);

  const fetchCartItems = async () => {

    if (!userId) return;

    try {

      setLoading(true);

      const response = await axiosHttp.get(`/cart-items/${userId}`);

      if (response.data.status === 200 && response.data.data?.items) {

        const transformed = response.data.data.items.map((item) => ({

          cartItemId: item.id,
          productId: item.productId,
          variantId: item.variantId,

          name: item.product.title || "Unknown Product",

          description:
            item.product.shortDescription || item.product.description,

          image:
            item.product_variant?.imageSrc ||
            item.product.imageUrls[0] ||
            "",

          imageUrls: item.product.imageUrls,

          price: parseFloat(
            item.priceSnapshot || item.product_variant?.price || 0
          ),

          originalPrice: parseFloat(
            item.mrpSnapshot || item.product?.mrp || 0
          ),

          size: item.product_variant?.title || "One Size",

          quantity: item.quantity || 1,

          availableStock:
            item.product_variant?.inventory?.availableStock ?? 100,

        }));

        dispatch(setCartItems(transformed));

        setSelectedItems(new Set(transformed.map(p => p.cartItemId)));

      }

      setLoading(false);

    } catch (error) {

      setLoading(false);

    }

  };

  /* ---------------- REMOVE ITEM ---------------- */

  const handleRemove = async (cartItemId) => {

    try {

      const itemToRemove = products.find(
        (p) => p.cartItemId === cartItemId
      );

      if (!itemToRemove) return;

      if (!userId) {

        dispatch(removeFromCart(itemToRemove.variantId));

        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cartItemId);
          return newSet;
        });

        return;
      }

      await axiosHttp.delete(endPoints.deleteCartItem, {
        data: { userId, cartItemId },
      });

      dispatch(removeFromCart(itemToRemove.variantId));

      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });

      fetchCartItems();

    } catch (error) {

      console.error("Remove item failed", error);

      alert(
        error.response?.data?.message ||
        "Failed to remove item"
      );

    }

  };

  /* ---------------- QUANTITY CHANGE ---------------- */

  const handleQuantityChange = async (cartItemId, newQuantity) => {

    if (newQuantity < 1) return;

    dispatch(updateQuantity({ cartItemId, quantity: newQuantity }));

    const result = await updateCartQuantity(cartItemId, newQuantity);

    if (!result.success) {
      fetchCartItems();
    }

  };

  /* ---------------- SELECT ITEM ---------------- */

  const handleToggleSelect = (cartItemId) => {

    setSelectedItems((prev) => {

      const newSet = new Set(prev);

      if (newSet.has(cartItemId)) newSet.delete(cartItemId);
      else newSet.add(cartItemId);

      return newSet;

    });

  };

  const handleSelectAll = () => {

    if (selectedItems.size === products.length) {

      setSelectedItems(new Set());
      dispatch(setSelectedCartItems([]));

    } else {

      const allIds = products.map((p) => p.cartItemId);

      setSelectedItems(new Set(allIds));
      dispatch(setSelectedCartItems(allIds));

    }

  };

  const selectedProducts = React.useMemo(() => {

    return products.filter((p) =>
      selectedItems.has(p.cartItemId)
    );

  }, [products, selectedItems]);

  /* ---------------- DELETE MODAL ---------------- */

  const openDeleteModal = (cartItemId) => {

    setDeleteTargetId(cartItemId);
    setDeleteError(null);
    setIsDeleteModalOpen(true);

  };

  const handleConfirmDelete = async () => {

    try {

      setIsDeleting(true);

      await handleRemove(deleteTargetId);

      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);

    } catch (error) {

      setDeleteError(error.message);

    } finally {

      setIsDeleting(false);

    }

  };

  /* ---------------- CHECKOUT ---------------- */

  const initiateCheckout = async () => {

    if (selectedProducts.length === 0) {
      toast.error("Select items first");
      return;
    }

    try {

      const response = await axiosHttp.post("/checkout/initiate", {

        mode: "cart",
        cartItemIds: selectedProducts.map((p) => p.cartItemId),

      });

      if (response.data?.success) {

        router.push("/checkout/address");

      }

    } catch (e) {

      toast.error("Checkout failed");

    }

  };

  /* ---------------- LOADING ---------------- */

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-black">Loading your cart...</div>
      </div>
    );

  }

  /* ---------------- PAGE ---------------- */

  return (

    <div className="min-h-screen py-8 mt-[130px]">

      <div className="max-w-7xl mx-auto px-4">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">
            SHOPPING BAG
          </h1>
          <p className="text-gray-600">
            {products.length} Products
          </p>
        </div>

        {products.length === 0 ? (

          <div className="text-center py-8">

            <Image
              src="/images/emptycart.png"
              width={256}
              height={256}
              alt="Empty Cart"
              className="mx-auto mb-2"
            />

            <p className="text-gray-600 text-lg">
              Your cart is waiting
            </p>

            <button
              onClick={() => (window.location.href = "/products")}
              className="mt-4 bg-black text-white px-6 py-2 rounded"
            >
              Continue Shopping
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* PRODUCTS */}

            <div className="lg:col-span-2">

              <div className="mb-4 flex items-center gap-2 p-4">

                <input
                  type="checkbox"
                  checked={
                    selectedItems.size === products.length &&
                    products.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 cursor-pointer accent-black"
                />

                <span className="text-sm font-medium text-black">
                  Select All ({selectedItems.size}/{products.length})
                </span>

              </div>

              {products.map((product) => (

                <CartProductCard
                  key={product.cartItemId}
                  product={product}
                  isSelected={selectedItems.has(product.cartItemId)}
                  onToggleSelect={handleToggleSelect}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />

              ))}

            </div>

            {/* ORDER SUMMARY */}

            <div className="lg:col-span-1">

              <OrderSummary
                products={selectedProducts}
                coupons={getCoupons}
                isUserLoggedIn={!!userId}
                onProceed={initiateCheckout}
                onProceedWithoutLogin={() => {

                  if (!userId) {
                    dispatch(openPhoneAuthModal("checkout"));
                  } else {
                    initiateCheckout();
                  }

                }}
              />

            </div>

          </div>

        )}

      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Remove Item"
        message="Are you sure you want to remove this item?"
        confirmText="Remove"
        error={deleteError}
      />

    </div>

  );

};

export default ShoppingCart;