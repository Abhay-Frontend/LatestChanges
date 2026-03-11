"use client";
import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setAppliedCoupon, clearAppliedCoupon } from "@/redux/slices/cartSlice";
import { X } from "lucide-react";
import useValidatePromo from "@/hooks/useValidatePromo";

const OrderSummary = ({
  products = [],
  onProceed,
  coupons = [],
  onAmountChange,
  isUserLoggedIn = true,
  onProceedWithoutLogin = null,
  session = null
}) => {

  const pathname = usePathname();
  const dispatch = useDispatch();

  const appliedCoupon = useSelector((state) => state.cart?.appliedCoupon);

  const [showModal, setShowModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);

  const { validatePromo, loading: promoLoading } = useValidatePromo();

  const isAddressPage = pathname === "/checkout/address";

  /* -------------------- TOTAL CALCULATIONS -------------------- */

  const { totalMrp, subtotal } = useMemo(() => {

    const mrp = products.reduce((sum, p) =>
      sum + (Number(p.originalPrice) || 0) * (p.quantity || 1), 0
    );

    const sub = products.reduce((sum, p) =>
      sum + (Number(p.price) || 0) * (p.quantity || 1), 0
    );

    return { totalMrp: mrp, subtotal: sub };

  }, [products]);

  const deliveryCharges = 0;
  const convenienceFee = 0;

  /* -------------------- COUPON CALCULATION -------------------- */

  const calculateCouponDiscount = (coupon) => {

    if (!coupon || !coupon.discountType) return 0;

    const percent = parseFloat(coupon.discountType.replace("%", ""));
    const discount = (subtotal * percent) / 100;

    return Math.min(discount, coupon.maxDiscountCap || discount);

  };

  const calculatePromoDiscount = (promo) => {

    if (!promo) return 0;

    if (promo.promoType === "percentage_discount") {

      const discount = (subtotal * promo.discountValue) / 100;

      return Math.min(discount, promo.maxDiscountCap || discount);

    }

    return 0;

  };

  const couponDiscount = appliedCoupon
    ? calculateCouponDiscount(appliedCoupon)
    : 0;

  const promoDiscount = appliedPromo
    ? calculatePromoDiscount(appliedPromo)
    : 0;

  const totalDiscount = couponDiscount + promoDiscount;

  const totalPrice = Math.max(
    0,
    subtotal + deliveryCharges + convenienceFee - totalDiscount
  );

  /* -------------------- ADDRESS PAGE TOTALS -------------------- */

  const sessionSubtotal = session?.subtotal || 0;
  const sessionMrp = session?.totalMrp || 0;
  const sessionTotal = session?.totalPayable || 0;
  const sessionDiscount = session?.discount || 0;

  /* -------------------- PROMO VALIDATION -------------------- */

  const handleValidatePromo = async () => {

    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    const result = await validatePromo(promoCode);

    if (!result.success) {
      setPromoError(result.error || "Invalid code");
      return;
    }

    const promoData = result.data;

    if (promoData.minCartValue && subtotal < promoData.minCartValue) {
      setPromoError(
        `Minimum cart value of ₹${promoData.minCartValue} required`
      );
      return;
    }

    setAppliedPromo(promoData);
    setPromoCode("");
    setPromoError("");

  };

  /* -------------------- PASS AMOUNT TO PARENT -------------------- */

  useEffect(() => {

    if (!onAmountChange) return;

    if (isAddressPage) {
      onAmountChange(sessionTotal);
    } else {
      onAmountChange(totalPrice);
    }

  }, [totalPrice, sessionTotal, onAmountChange, isAddressPage]);

  /* -------------------- PROCEED BUTTON -------------------- */

  const handleProceed = () => {

    if (!isUserLoggedIn && onProceedWithoutLogin) {
      onProceedWithoutLogin();
      return;
    }

    if (products.length === 0) {
      alert("Please select at least one product to proceed.");
      return;
    }

    if (onProceed) onProceed();

  };

  /* -------------------- UI -------------------- */

  return (

    <div className="bg-white rounded-lg shadow-sm p-6">

      {/* COUPON SECTION */}

      {!isAddressPage && (

        <div className="mb-6">

          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-black">COUPONS</span>

            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-[#9c90ff] hover:underline"
            >
              VIEW MORE
            </button>
          </div>

          {appliedCoupon && (

            <div className="border rounded p-2 text-sm text-black mb-4">

              <div className="flex justify-between items-center">

                <span className="font-semibold">
                  {appliedCoupon.name}
                </span>

                <button
                  onClick={() => dispatch(clearAppliedCoupon())}
                  className="text-[#9c90ff] text-xs underline"
                >
                  Remove
                </button>

              </div>

              <p className="text-xs text-gray-600 mt-1">
                Code:
                <span className="font-mono ml-1">
                  {appliedCoupon.code}
                </span>
              </p>

            </div>

          )}

          {/* PROMO INPUT */}

          <div className="flex gap-2">

            <input
              value={promoCode}
              onChange={(e) =>
                setPromoCode(e.target.value.toUpperCase())
              }
              placeholder="Enter promo code"
              disabled={!!appliedPromo}
              className="flex-1 border rounded px-3 py-2 text-sm text-black"
            />

            <button
              onClick={handleValidatePromo}
              disabled={promoLoading || !!appliedPromo}
              className="bg-black text-white px-4 py-2 rounded text-sm"
            >
              {promoLoading ? "..." : "Apply"}
            </button>

          </div>

          {promoError && (
            <p className="text-xs text-red-500 mt-1">
              {promoError}
            </p>
          )}

        </div>

      )}

      {/* ORDER DETAILS */}

      <div className="border-t pt-4">

        <h3 className="font-semibold mb-4 text-black">
          ORDER DETAILS
        </h3>

        <div className="space-y-3 text-sm">

          <div className="flex justify-between">
            <span>Total MRP</span>
            <span className="font-semibold">
              ₹{isAddressPage ? sessionMrp : totalMrp}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">
              ₹{isAddressPage ? sessionSubtotal : subtotal}
            </span>
          </div>

          {(isAddressPage ? sessionDiscount : totalDiscount) > 0 && (

            <div className="flex justify-between text-black">
              <span>Discount</span>

              <span>
                - ₹{isAddressPage ? sessionDiscount : totalDiscount}
              </span>

            </div>

          )}

          <div className="flex justify-between">
            <span>Delivery Charges</span>
            <span className="text-[#9c90ff]">Free</span>
          </div>

        </div>

        {/* TOTAL */}

        <div className="flex justify-between items-center mt-4 pt-4 border-t">

          <span className="font-semibold text-black">
            Total Price
          </span>

          <span className="font-bold text-lg text-black">
            ₹{isAddressPage ? sessionTotal : totalPrice}
          </span>

        </div>

      </div>

      {/* PROCEED BUTTON */}

      {!isAddressPage && (

        <button
          onClick={handleProceed}
          className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 mt-4 font-medium"
        >
          Proceed to Checkout
        </button>

      )}

    </div>

  );

};

export default OrderSummary;