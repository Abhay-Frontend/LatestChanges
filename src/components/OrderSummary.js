"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setAppliedCoupon, clearAppliedCoupon } from "@/redux/slices/cartSlice";
import { X } from "lucide-react";
import Link from "next/link";
import useValidatePromo from "@/hooks/useValidatePromo";

const OrderSummary = ({
  products,
  onProceed,
  coupons = [],
  onAmountChange,
  isUserLoggedIn = true,
  onProceedWithoutLogin = null,
}) => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const appliedCoupon = useSelector((state) => state.cart?.appliedCoupon);
  const [showModal, setShowModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const { validatePromo, loading: promoLoading } = useValidatePromo();

  // Load applied promo and coupon from localStorage on mount
  useEffect(() => {
    // Load promo
    const savedPromo = localStorage.getItem("appliedPromo");
    if (savedPromo) {
      try {
        setAppliedPromo(JSON.parse(savedPromo));
      } catch (e) {
        localStorage.removeItem("appliedPromo");
      }
    }

    // Load coupon and sync with Redux if not already in Redux
    const savedCoupon = localStorage.getItem("appliedCoupon");
    if (savedCoupon && !appliedCoupon) {
      try {
        const couponData = JSON.parse(savedCoupon);
        dispatch(setAppliedCoupon(couponData));
      } catch (e) {
        localStorage.removeItem("appliedCoupon");
      }
    }
  }, []);

  // Save coupon to localStorage whenever it changes
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  }, [appliedCoupon]);

  const totalMrp = products.reduce(
    (sum, p) => sum + (p.originalPrice || 0) * p.quantity,
    0
  );

  // Total Variant Price
  const totalVariantPrice = products.reduce(
    (sum, p) => sum + (p.price || 0) * p.quantity,
    0
  );

  // Subtotal = (MRP - Selling Price)
  const subtotal = totalVariantPrice;

  const deliveryCharges = 0;
  const convenienceFee = 0;

  // Coupon Calculation
  const calculateCouponDiscount = (coupon) => {
    if (!coupon || !coupon.discountType) return 0;

    const discountPercent = parseFloat(coupon.discountType.replace("%", ""));
    const discountAmount = (subtotal * discountPercent) / 100;

    return Math.min(discountAmount, coupon.maxDiscountCap || discountAmount);
  };

  // Promo Calculation
  const calculatePromoDiscount = (promo) => {
    if (!promo) return 0;

    if (promo.promoType === "percentage_discount" && promo.discountValue) {
      const discountAmount = (subtotal * promo.discountValue) / 100;
      return Math.min(discountAmount, promo.maxDiscountCap || discountAmount);
    }

    return 0;
  };

  const couponDiscount = appliedCoupon
    ? calculateCouponDiscount(appliedCoupon)
    : 0;
  const promoDiscount = appliedPromo ? calculatePromoDiscount(appliedPromo) : 0;
  const totalDiscount = couponDiscount + promoDiscount;

  const totalPrice =
    subtotal + deliveryCharges + convenienceFee - totalDiscount;

  const handleApplyCoupon = (coupon) => {
    dispatch(setAppliedCoupon(coupon));
    localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    setShowModal(false);
  };

  const handleRemoveCoupon = () => {
    dispatch(clearAppliedCoupon());
    localStorage.removeItem("appliedCoupon");
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    localStorage.removeItem("appliedPromo");
    setPromoCode("");
    setPromoError("");
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setPromoError("");
    const result = await validatePromo(promoCode.trim());

    if (result.success) {
      const promoData = result.data;

      // Check minimum cart value
      if (promoData.minCartValue && subtotal < promoData.minCartValue) {
        setPromoError(
          `Minimum cart value of ₹${promoData.minCartValue} required`
        );
        return;
      }

      // Apply the promo separately and save to localStorage
      setAppliedPromo(promoData);
      localStorage.setItem("appliedPromo", JSON.stringify(promoData));
      setPromoError("");
      setPromoCode("");
    } else {
      setPromoError(result.error || "Invalid promo code");
    }
  };

  const isAddressPage = pathname === "/checkout/address";

  // Auto-remove coupon if cart value falls below minimum
  useEffect(() => {
    if (
      appliedCoupon &&
      appliedCoupon.minCartValue &&
      subtotal < appliedCoupon.minCartValue
    ) {
      dispatch(clearAppliedCoupon());
    }
  }, [subtotal, appliedCoupon, dispatch]);

  // Auto-remove promo if cart value falls below minimum
  useEffect(() => {
    if (
      appliedPromo &&
      appliedPromo.minCartValue &&
      subtotal < appliedPromo.minCartValue
    ) {
      setAppliedPromo(null);
      localStorage.removeItem("appliedPromo");
    }
  }, [subtotal, appliedPromo]);

  useEffect(() => {
    if (onAmountChange) {
      onAmountChange(totalPrice);
    }
  }, [totalPrice, onAmountChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 top-4">
      {/* COUPON SECTION */}
      {!isAddressPage && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-black">COUPONS</span>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-[#9c90ff] hover:underline cursor-pointer"
            >
              VIEW MORE
            </button>
          </div>

          {/* Coupon Availability */}
          {appliedCoupon ? (
            <div className="border rounded p-2 text-sm text-black  mb-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{appliedCoupon.name}</span>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-[#9c90ff] text-xs underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Code: <span className="font-mono">{appliedCoupon.code}</span>
              </p>
              <p className="text-xs text-[#9c90ff] mt-1 font-medium">
                ✓ Coupon Applied
              </p>
            </div>
          ) : coupons.length > 0 ? (
            <p className="text-gray-600 text-sm mb-4">
              {coupons.length} coupon{coupons.length > 1 ? "s" : ""} available
            </p>
          ) : (
            <p className="text-gray-500 text-sm mb-4">No coupons available</p>
          )}

          {/* Promo Code Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                disabled={!!appliedPromo}
                className="flex-1 border rounded px-3 py-2 text-sm text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleValidatePromo}
                disabled={promoLoading || !!appliedPromo}
                className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {promoLoading ? "..." : "Apply"}
              </button>
            </div>
            {promoError && (
              <p className="text-xs text-[#9c90ff] mt-1">{promoError}</p>
            )}
          </div>

          {/* Applied Promo */}
          {appliedPromo && (
            <div className="border rounded p-2 text-sm text-black  mb-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{appliedPromo.code}</span>
                <button
                  onClick={handleRemovePromo}
                  className="text-[#9c90ff] text-xs underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Promo: <span className="font-mono">{appliedPromo.code}</span>
              </p>
              <p className="text-xs text-[#9c90ff] mt-1 font-medium">
                ✓ Promo Applied
              </p>
            </div>
          )}
        </div>
      )}

      {/* ORDER DETAILS */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4 text-black">ORDER DETAILS</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-black">Total MRP</span>
            <span className="font-semibold text-black">
              ₹{totalMrp.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-black">Subtotal</span>
            <span className="font-semibold text-black">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>

          {/* <div className="flex justify-between">
            <span className="text-black">GST (18%)</span>
            <span className="font-semibold text-black">₹{gst.toFixed(2)}</span>
          </div> */}

          {couponDiscount > 0 && (
            <div className="flex justify-between text-black">
              <span>Coupon Discount</span>
              <span>- ₹{couponDiscount.toFixed(2)}</span>
            </div>
          )}

          {promoDiscount > 0 && (
            <div className="flex justify-between text-black">
              <span>Promo Discount</span>
              <span>- ₹{promoDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-black">Delivery Charges</span>
            <span className="text-[#9c90ff]">
              {deliveryCharges === 0 ? "Free" : `₹${deliveryCharges}`}
            </span>
          </div>

          {/* <div className="flex justify-between">
            <span className="text-black">Convenience Fee</span>
            <span className="text-black">
              {convenienceFee === 0 ? "₹0" : `₹${convenienceFee}`}
            </span>
          </div> */}
        </div>

        {/* TOTAL */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="font-semibold text-black">Total Price</span>
          <span className="font-bold text-lg text-black">
            ₹{totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* PROCEED */}
      {!isAddressPage &&
        (isUserLoggedIn ? (
          // LOGGED IN USER: Call onProceed (Meta Track) then navigate
          <Link
            href="/checkout/address"
            onClick={() => onProceed && onProceed()} // <--- TRIGGER TRACKING OF META PIXEL HERE
            className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium mt-4 inline-block text-center"
          >
            Proceed to Checkout
          </Link>
        ) : (
          // NOT LOGGED IN: Call onProceedWithoutLogin (Meta Track + Login Modal)
          <button
            onClick={() => onProceedWithoutLogin && onProceedWithoutLogin()}
            className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium mt-4 cursor-pointer"
          >
            Proceed to Checkout
          </button>
        ))}

      {/* COUPON MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-96 max-h-[80vh] overflow-y-auto shadow-lg relative p-6">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black cursor-pointer"
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold text-black mb-4">
              Available Coupons
            </h2>

            {coupons.length > 0 ? (
              <div className="space-y-4">
                {coupons.map((coupon) => {
                  const isCouponDisabled = subtotal < coupon.minCartValue;
                  return (
                    <div
                      key={coupon.id}
                      className={`border rounded p-3 ${
                        isCouponDisabled
                          ? "bg-gray-100 opacity-75"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-black">
                            {coupon.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Code:{" "}
                            <span className="font-mono">{coupon.code}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleApplyCoupon(coupon)}
                          disabled={isCouponDisabled}
                          className={`text-xs underline ${
                            isCouponDisabled
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600 cursor-pointer"
                          }`}
                        >
                          Apply
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {coupon.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Discount: {coupon.discountType}
                      </p>
                      {isCouponDisabled && (
                        <p className="text-xs text-[#9c90ff] mt-2 font-medium">
                          Min cart value: ₹{coupon.minCartValue}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No coupons available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
