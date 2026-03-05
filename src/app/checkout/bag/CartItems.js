"use client";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import OrderSummary from "@/components/OrderSummary";
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import CartProductCard from "@/components/CartProductCard";
import useGetCoupons from "@/hooks/useGetCoupons";
import useUpdateCartQuantity from "@/hooks/useUpdateCartQuantity";
import Link from "next/link";
import DeleteConfirmModal from "@/components/DeleteModal";
import { openPhoneAuthModal } from "@/redux/slices/loginmodalSlice";
// PhoneAuthModal is now rendered globally in Providers.js
import {
  removeFromCart,
  setCartItems,
  setItemSelected,
  setSelectedCartItems,
} from "@/redux/slices/cartSlice";
import Image from "next/image";

const ShoppingCart = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const isInitialMount = useRef(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getCoupons = useGetCoupons();
  const { updateQuantity: updateCartQuantity } = useUpdateCartQuantity();

  const cartItemsFromRedux = useSelector((state) => state.cart?.items || []);

  // Get userId from Redux
  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;

  // Fetch cart items from API
  useEffect(() => {
    if (userId) {
      fetchCartItems();
    }
  }, [userId]);

  // 1. Track ViewCart when products are loaded
  useEffect(() => {
    if (!loading && products.length > 0 && window.fbq) {
      window.fbq('track', 'ViewCart', {
        content_ids: products.map(p => p.productId.toString()),
        content_type: 'product',
        value: products.reduce((acc, p) => acc + (p.price * p.quantity), 0),
        currency: 'INR'
      });
    }
  }, [loading, products.length]);
  // 2. Function to track InitiateCheckout (Pass this to OrderSummary)
  const trackInitiateCheckout = () => {
    if (typeof window !== "undefined" && window.fbq && selectedProducts.length > 0) {
      const totalValue = selectedProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
      
      window.fbq('track', 'InitiateCheckout', {
        content_ids: selectedProducts.map(p => p.productId.toString()),
        content_type: 'product',
        num_items: selectedProducts.length,
        value: totalValue,
        currency: 'INR'
      });
    }
  };

  // Auto-select all items ONLY when products load initially, or restore from localStorage
  useEffect(() => {
    if (products.length > 0 && isInitialMount.current) {
      // Check if user came from "Buy Now" button
      const buyNowVariantId = localStorage.getItem("buyNowVariantId");

      if (buyNowVariantId) {
        // Find the product with matching variant ID
        const buyNowProduct = products.find(
          (p) => p.variantId?.toString() === buyNowVariantId,
        );

        if (buyNowProduct) {
          // Only select the Buy Now item
          setSelectedItems(new Set([buyNowProduct.cartItemId]));
          dispatch(setSelectedCartItems([buyNowProduct.cartItemId]));

          // Clear the flag
          localStorage.removeItem("buyNowVariantId");
          isInitialMount.current = false;
          return;
        }

        // Clear the flag even if product not found
        localStorage.removeItem("buyNowVariantId");
      }

      // Try to restore saved selection from localStorage first
      let restoredSelection = false;
      try {
        const saved = localStorage.getItem(`lafetch_checkout_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.items && Array.isArray(parsed.items)) {
            const savedCartItemIds = new Set(
              parsed.items
                .filter((item) => item.selected)
                .map((item) => item.cartItemId),
            );
            // Only restore if some items were selected
            if (savedCartItemIds.size > 0) {
              // Filter to only include items that exist in current products
              const validSelectedIds = new Set(
                Array.from(savedCartItemIds).filter((id) =>
                  products.some((p) => p.cartItemId === id),
                ),
              );
              if (validSelectedIds.size > 0) {
                setSelectedItems(validSelectedIds);
                dispatch(setSelectedCartItems(Array.from(validSelectedIds)));
                restoredSelection = true;
              }
            }
          }
        }
      } catch (e) {}

      // If no saved selection was restored, select all items by default
      if (!restoredSelection) {
        setSelectedItems(new Set(products.map((p) => p.cartItemId)));
        dispatch(setSelectedCartItems(products.map((p) => p.cartItemId)));
      }

      isInitialMount.current = false;
    }
  }, [products, userId, dispatch]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await axiosHttp.get(`/cart-items/${userId}`);

      if (response.data.status === 200 && response.data.data) {
        // Transform API data to component format - use quantity directly from API
        const transformedData = response.data.data.map((item) => ({
          id: item.id,
          cartItemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.product.title,
          description:
            item.product.shortDescription || item.product.description,
          image:
            item.product_variant?.imageSrc || item.product.imageUrls[0] || "",
          imageUrls: item.product.imageUrls,
          price:
            item.pricing?.unitPrice ||
            item.product_variant?.price ||
            item.product.basePrice ||
            0,
          originalPrice: item.product.mrp || item.product.basePrice,
          size: item.product_variant?.title || "One Size",
          quantity: item.quantity || 1, // Use quantity directly from API
          availableStock: item.product_variant?.inventory?.availableStock || 0, // Available stock from inventory
          availableSizes: item.product_variant?.title
            ? [item.product_variant.title]
            : ["One Size"],
          type: item.product.type,
          tags: item.product.tags,
          hasCOD: item.product.hasCOD,
          hasExchange: item.product.hasExchange,
          exchangeDays: item.product.exchangeDays,
        }));

        setProducts(transformedData);

        // Keep Redux cart items in sync for selection state only
        const payload = transformedData.map((m) => ({
          ...m,
          cartItemId: m.cartItemId,
          variantId: m.variantId || null,
          selected:
            (
              cartItemsFromRedux.find((ci) => ci.cartItemId === m.cartItemId) ||
              {}
            ).selected ?? true,
        }));

        dispatch(setCartItems(payload));

        // Trigger cross-tab sync via localStorage 
        try {
          localStorage.setItem("lafetch_cart_updated", JSON.stringify(payload));
          // Clear immediately so it can be triggered again
          setTimeout(
            () => localStorage.removeItem("lafetch_cart_updated"),
            100,
          );
        } catch (e) {}
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Persist checkout selection state to localStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const key = `lafetch_checkout_${userId}`;
      const existingRaw = localStorage.getItem(key);
      let existing = {};
      if (existingRaw) existing = JSON.parse(existingRaw);

      const itemsToSave = products.map((p) => ({
        cartItemId: p.cartItemId,
        productId: p.productId,
        variantId: p.variantId,
        productName: p.name,
        quantity: p.quantity || 1, // Store for reference but API is source of truth
        unitPrice: p.price || 0,
        discount: 0,
        tax: 0,
        total: +((p.price || 0) * (p.quantity || 1)).toFixed(2),
        sku: p.sku || "",
        hsn: p.hsn || "",
        selected: selectedItems.has(p.cartItemId),
      }));

      const merged = {
        ...(existing || {}),
        items: itemsToSave,
      };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (e) {}
  }, [products, selectedItems, userId]);

  const handleRemove = async (productId) => {
    try {
      const itemToRemove = products.find((p) => p.productId === productId);

      if (!userId) {
        // Handle removal for non-logged-in users (Redux + localStorage)
        if (itemToRemove) {
          // Remove from Redux
          dispatch(removeFromCart(itemToRemove.variantId));

          // Remove from local state
          setProducts((prev) => prev.filter((p) => p.productId !== productId));

          // Remove from selected items
          setSelectedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemToRemove.cartItemId);
            return newSet;
          });

          // Update localStorage
          try {
            const savedKeys = Object.keys(localStorage).filter((key) =>
              key.startsWith("lafetch_checkout_"),
            );
            if (savedKeys.length > 0) {
              const lastKey = savedKeys[savedKeys.length - 1];
              const raw = localStorage.getItem(lastKey);
              if (raw) {
                const saved = JSON.parse(raw);
                if (saved.items && Array.isArray(saved.items)) {
                  saved.items = saved.items.filter(
                    (item) => item.productId !== productId,
                  );
                  localStorage.setItem(lastKey, JSON.stringify(saved));
                }
              }
            }
          } catch (e) {}
        }
        return;
      }

      // Handle removal for logged-in users (API call)
      const isDeleted = await axiosHttp.delete(endPoints.deleteCartItem, {
        data: {
          userId: userId,
          productId: productId,
        },
      });
      if (isDeleted) {
        // Remove from selectedItems before fetching
        if (itemToRemove) {
          setSelectedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemToRemove.cartItemId);
            return newSet;
          });

          // Remove from Redux
          dispatch(removeFromCart(itemToRemove.variantId));
        }
        fetchCartItems();
      }
    } catch (error) {
      // Check if it's a foreign key constraint error
      if (
        error.response?.data?.message?.includes("foreign key constraint") ||
        error.response?.data?.message?.includes("linked to")
      ) {
        throw new Error(
          "Failed to delete. This item is linked to an existing order.",
        );
      }
      throw new Error("Failed to remove item. Please try again.");
    }
  };

  const handleQuantityChange = async (cartItemId, quantity) => {
    try {
      // Find the product to get productId and variantId
      const product = products.find((p) => p.cartItemId === cartItemId);
      if (!product) return;

      // If quantity is 0, remove the item directly without showing modal
      if (quantity === 0) {
        await handleRemove(product.productId);
        return;
      }

      // Optimistically update UI
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.cartItemId === cartItemId ? { ...p, quantity } : p,
        ),
      );

      // Call API to update quantity on server
      const result = await updateCartQuantity(
        userId,
        product.productId,
        product.variantId,
        quantity,
      );

      // If API call fails, revert the optimistic update
      if (!result.success) {
        fetchCartItems(); // Refresh from server
      }
    } catch (error) {
      fetchCartItems(); // Refresh from server on error
    }
  };

  const handleSizeChange = async (cartItemId, size) => {
    try {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.cartItemId === cartItemId ? { ...p, size } : p,
        ),
      );
    } catch (error) {}
  };

  // Handle individual item selection
  const handleToggleSelect = (cartItemId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      const isSelected = newSet.has(cartItemId);

      if (isSelected) {
        newSet.delete(cartItemId);
      } else {
        newSet.add(cartItemId);
      }

      // Dispatch after state calculation, outside the setState callback
      Promise.resolve().then(() => {
        dispatch(setItemSelected({ cartItemId, selected: !isSelected }));
      });

      return newSet;
    });
  };

  // Handle select all/deselect all
  const handleSelectAll = () => {
    if (selectedItems.size === products.length) {
      setSelectedItems(new Set());
      dispatch(setSelectedCartItems([]));
    } else {
      setSelectedItems(new Set(products.map((p) => p.cartItemId)));
      dispatch(setSelectedCartItems(products.map((p) => p.cartItemId)));
    }
  };

  // Filter selected products for checkout
  const selectedProducts = React.useMemo(() => {
    const filtered = products.filter((p) => selectedItems.has(p.cartItemId));

    return filtered;
  }, [products, selectedItems]);

  const openDeleteModal = (productId) => {
    setDeleteTargetId(productId);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await handleRemove(deleteTargetId);
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      setDeleteError(
        error.message || "Failed to remove item. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Load cart from Redux or localStorage if user is not logged in
  useEffect(() => {
    if (!userId) {
      try {
        // First priority: Use Redux cart items if they exist
        if (cartItemsFromRedux && cartItemsFromRedux.length > 0) {
          // Transform Redux items to component format
          const transformedReduxItems = cartItemsFromRedux.map((item) => {
            // Find the selected variant
            const selectedVariant =
              item.variants?.find(
                (v) => v.id?.toString() === item.variantId?.toString(),
              ) || item.variants?.[0];

            return {
              id: item.id,
              cartItemId: item.variantId || item.id,
              productId: item.id,
              variantId: item.variantId || selectedVariant?.id,
              name: item.title,
              description: item.shortDescription || item.description,
              image: item.imageUrls?.[0] || selectedVariant?.imageSrc || "",
              imageUrls: item.imageUrls || [],
              price: selectedVariant?.price || item.basePrice || 0,
              originalPrice: item.mrp || item.basePrice || 0,
              size: selectedVariant?.title || "One Size",
              quantity: item.quantity || 1,
              availableSizes: item.variants?.map((v) => v.title) || [
                selectedVariant?.title,
              ],
              type: item.type || "",
              tags: item.tags || [],
              hasCOD: item.hasCOD,
              hasExchange: item.hasExchange,
              exchangeDays: item.exchangeDays,
              selected: item.selected !== false,
            };
          });

          setProducts(transformedReduxItems);
          setSelectedItems(
            new Set(transformedReduxItems.map((p) => p.cartItemId)),
          );
          setLoading(false);
          return;
        }

        // Fallback: Try to get any saved checkout data from localStorage
        const savedKeys = Object.keys(localStorage).filter((key) =>
          key.startsWith("lafetch_checkout_"),
        );

        if (savedKeys.length > 0) {
          // Get the most recent saved checkout
          const lastKey = savedKeys[savedKeys.length - 1];
          const raw = localStorage.getItem(lastKey);
          if (raw) {
            const saved = JSON.parse(raw);
            if (saved.items && Array.isArray(saved.items)) {
              setProducts(saved.items);
              setSelectedItems(new Set(saved.items.map((p) => p.cartItemId)));
              setLoading(false);
            }
          }
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    }
  }, [userId, cartItemsFromRedux]);

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-lg text-black">Loading your cart...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen  py-8 mt-[130px]">
        <div className="max-w-7xl mx-auto px-4">
          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-2 text-sm">
            <Link
              href="/checkout/bag"
              className="text-black underline decoration-[#988BFF] decoration-[2px] font-bold"
            >
              BAG
            </Link>
            <span className="text-black">--------</span>
            <Link href="/checkout/address" className="text-black ">
              ADDRESS
            </Link>
            <span className="text-black">--------</span>
            <span className="text-black">PAYMENT</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-black">SHOPPING BAG</h1>
            <p className="text-gray-600">{products.length} Products</p>
          </div>

          {/* Main Content */}
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Image
                src="/images/emptycart.png"
                width={256}
                height={256}
                alt="Empty Cart"
                className="mx-auto mb-2  object-contain"
              />
              <p className="text-gray-600 text-lg">Your cart is waiting</p>
              <button
                onClick={() => (window.location.href = "/products")}
                className="mt-4 bg-black text-white px-6 py-2 rounded hover:bg-gray-800 cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side - Product Cards */}
              <div className="lg:col-span-2">
                {/* Select All Checkbox */}
                <div className="mb-4 flex items-center gap-2  p-4 rounded-lg ">
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

                {/* Product Cards */}
                <div className="">
                  {products.map((product) => (
                    <CartProductCard
                      key={product.cartItemId}
                      product={product}
                      onRemove={() => openDeleteModal(product.productId)}
                      onQuantityChange={handleQuantityChange}
                      onSizeChange={handleSizeChange}
                      isSelected={selectedItems.has(product.cartItemId)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}

                  <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                      setIsDeleteModalOpen(false);
                      setDeleteError(null);
                      setDeleteTargetId(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    loading={isDeleting}
                    title="Remove Item"
                    message="Are you sure you want to remove this item from your cart?"
                    confirmText="Remove"
                    error={deleteError}
                  />
                </div>
              </div>

              {/* Right Side - Order Summary */}
              <div className="lg:col-span-1">
                <OrderSummary
                  key={`order-summary-${selectedProducts
                    .map((p) => `${p.cartItemId}-${p.quantity}`)
                    .join("-")}`}
                  products={selectedProducts}
                  coupons={getCoupons}
                  isUserLoggedIn={!!userId}
                  onProceed={trackInitiateCheckout}
                  onProceedWithoutLogin={() => {
                    trackInitiateCheckout();
                    if (!userId) {
                      dispatch(openPhoneAuthModal("checkout"));
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShoppingCart;
