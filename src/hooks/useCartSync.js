import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import { setCartItems } from "@/redux/slices/cartSlice";

const useCartSync = () => {
  const dispatch = useDispatch();
  const isInitialSync = useRef(false);
  const syncInProgress = useRef(false);
  const hasFetchedCart = useRef(false);

  const userInfo = useSelector((state) => state.user?.userInfo);
  const userId = userInfo?.id;

  const cartItems = useSelector((state) => state.cart?.items || []);

  // Fetch cart items from server when user logs in
  useEffect(() => {
    const fetchCartFromServer = async () => {
      if (!userId || hasFetchedCart.current) return;

      hasFetchedCart.current = true;

      try {
        const response = await axiosHttp.get(`/cart-items/${userId}`);
if (response.data.status === 200 && response.data.data?.items) {
  const itemsArray = response.data.data.items; // ✅ get the array
  const transformedData = itemsArray.map((item) => ({
    id: item.id,
    cartItemId: item.id,
    productId: item.productId,
    variantId: item.variantId,
    title: item.product.title,
    description: item.product.shortDescription || item.product.description,
    imageUrls: item.product.imageUrls || [],
    basePrice: item.pricing?.unitPrice || item.product_variant?.price || item.product.basePrice || 0,
    mrp: item.product.mrp || item.product.basePrice,
    quantity: item.quantity || 1,
    variants: item.product_variant
      ? [{
          id: item.variantId,
          title: item.product_variant.title,
          price: item.product_variant.price,
          imageSrc: item.product_variant.imageSrc,
        }]
      : [],
    type: item.product.type,
    tags: item.product.tags,
    hasCOD: item.product.hasCOD,
    hasExchange: item.product.hasExchange,
    exchangeDays: item.product.exchangeDays,
    selected: true,
  }));

  dispatch(setCartItems(transformedData));
}
      } catch (error) {
        console.error("Fetch cart failed:", error);
      }
    };

    fetchCartFromServer();
  }, [userId, dispatch]);

  // Sync local cart to server when user logs in
  useEffect(() => {
    const syncCartToServer = async () => {
      if (syncInProgress.current) return;
      if (!userId || cartItems.length === 0 || isInitialSync.current) return;

      syncInProgress.current = true;
      isInitialSync.current = true;

      try {
        // 1️⃣ Sync local items
        await axiosHttp.post(endPoints.cartsync, {
          userId,
          cartType: "ECOM",
          items: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity || 1,
          })),
        });

        // 2️⃣ Fetch updated cart from server
       const response = await axiosHttp.get(`/cart-items/${userId}`);
if (response.data.status === 200 && response.data.data?.items) {
  const itemsArray = response.data.data.items; // ✅ get the array
  const transformedData = itemsArray.map((item) => ({
    id: item.id,
    cartItemId: item.id,
    productId: item.productId,
    variantId: item.variantId,
    title: item.product.title,
    description: item.product.shortDescription || item.product.description,
    imageUrls: item.product.imageUrls || [],
    basePrice: item.pricing?.unitPrice || item.product_variant?.price || item.product.basePrice || 0,
    mrp: item.product.mrp || item.product.basePrice,
    quantity: item.quantity || 1,
    variants: item.product_variant
      ? [{
          id: item.variantId,
          title: item.product_variant.title,
          price: item.product_variant.price,
          imageSrc: item.product_variant.imageSrc,
        }]
      : [],
    type: item.product.type,
    tags: item.product.tags,
    hasCOD: item.product.hasCOD,
    hasExchange: item.product.hasExchange,
    exchangeDays: item.product.exchangeDays,
    selected: true,
  }));

  dispatch(setCartItems(transformedData));
}
      } catch (error) {
        console.error("Cart sync failed:", error);
      } finally {
        syncInProgress.current = false;
      }
    };

    syncCartToServer();
  }, [userId]); // only depend on userId

  return {
    isSynced: isInitialSync.current,
    cartItemsCount: cartItems.length,
  };
};

export default useCartSync;
