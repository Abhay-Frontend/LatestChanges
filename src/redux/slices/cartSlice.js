import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [], // store products + variant info
    totalItems: 0, // count of unique variant items
    appliedCoupon: null, // store applied coupon for checkout
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, variantId } = action.payload;

      // check if this exact variant already exists
      const alreadyInCart = state.items.some(
        (item) => item.variantId === variantId
      );

      if (!alreadyInCart) {
        // store product + variant together
        state.items.push({ ...product, variantId });
        state.totalItems = state.items.length;
      }
    },

    removeFromCart: (state, action) => {
      const variantId = action.payload;
      state.items = state.items.filter((item) => item.variantId !== variantId);
      state.totalItems = state.items.length;
    },
    setCartItems: (state, action) => {
      // Ensure each item has a quantity and selected flag
      state.items = (action.payload || []).map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 1,
        selected: it.selected ?? true,
        // quantity: it.quantity || 1,
        // selected: typeof it.selected === "boolean" ? it.selected : true,
      }));
      state.totalItems = state.items.length;
    },

    // Update the quantity for a specific cart item by cartItemId
    updateQuantity: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const item = state.items.find((i) => i.cartItemId === cartItemId);
      if (item) item.quantity = quantity;
    },

    // Set selected flag for a single cart item
    setItemSelected: (state, action) => {
      const { cartItemId, selected } = action.payload;
      const item = state.items.find((i) => i.cartItemId === cartItemId);
      if (item) item.selected = !!selected;
    },

    // Set selected cart items from an array of cartItemIds (others become unselected)
    setSelectedCartItems: (state, action) => {
      const selectedArray = action.payload || [];
      state.items = state.items.map((i) => ({
        ...i,
        selected: selectedArray.includes(i.cartItemId),
      }));
    },

    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.appliedCoupon = null;
    },

    // Set applied coupon
    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },

    // Clear applied coupon
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  setCartItems,
  updateQuantity,
  setItemSelected,
  setSelectedCartItems,
  setAppliedCoupon,
  clearAppliedCoupon,
} = cartSlice.actions;
export default cartSlice.reducer;
