"use client";

import { Provider } from "react-redux";
import { store, persistor } from "@/redux/store"; // import persistor
import { PersistGate } from "redux-persist/integration/react";
import useCartSync from "@/hooks/useCartSync";
import PhoneAuthModal from "@/components/LoginModal";
import ProductModal from "@/components/Modal";
import MetaPixelEvents from "@/components/MetaPixelEvent";

function CartSyncWrapper({ children }) {
  useCartSync(); // Initialize cart sync - NOW INSIDE PROVIDER
  return children;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CartSyncWrapper>
          {/* Global PhoneAuthModal - Only one instance */}
          <PhoneAuthModal />
          {/* Global ProductModal - Only one instance */}
          <ProductModal />
          {children}
          <MetaPixelEvents/>
        </CartSyncWrapper>
      </PersistGate>
    </Provider>
  );
}
