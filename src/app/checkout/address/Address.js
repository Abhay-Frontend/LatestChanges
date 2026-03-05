"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import OrderSummary from "@/components/OrderSummary";
import AddressCard from "@/components/AddressCard";
import AddressModal from "@/components/AddressModal";
import DeleteConfirmModal from "@/components/DeleteModal";
import PaymentStatusModal from "@/components/ordersmodal/PayementConfirmationModal";
import axiosHttp from "@/utils/axioshttp";
import { endPoints } from "@/utils/endpoints";
import useGetCoupons from "@/hooks/useGetCoupons";
import Link from "next/link";
import Footer from "@/components/footer";
import { setCartItems } from "@/redux/slices/cartSlice";
import toast from "react-hot-toast";

const CheckOutAddress = () => {
  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState({});
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const getCoupons = useGetCoupons();
  const userInfo = useSelector((state) => state.user?.userInfo);
  const cartItemsFromRedux = useSelector((state) => state.cart?.items || []);
  const appliedCoupon = useSelector((state) => state.cart?.appliedCoupon);
  const userId = userInfo?.id;
  const dispatch = useDispatch();
  const router = useRouter();
  
  const buyNowProduct = useSelector((state) => state.buyNow?.product);
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    if (userId && !loading && products.length > 0 && orderTotal>0) {
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_ids: products.map(p => p.productId.toString()),
          content_type: 'product',
          value: orderTotal,
          currency: 'INR',
          num_items: products.reduce((sum, p) => sum + (p.quantity || 1), 0)
        });
      }
    }
  }, [userId, loading, products,orderTotal]); // Fires when products finish loading
  

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        // Check if already loaded
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  // useEffect(() => {
  //   if (userId) {
  //     fetchCartItems();
  //     fetchAddresses();
  //     // Load saved checkout from localStorage
  //     try {
  //       const saved = localStorage.getItem(`lafetch_checkout_${userId}`);
  //       if (saved) {
  //         const parsed = JSON.parse(saved);
  //         if (parsed.selectedAddressId)
  //           setSelectedAddressId(parsed.selectedAddressId);
  //         if (parsed.orderTotal) setOrderTotal(parsed.orderTotal);
  //       }
  //     } catch (e) {}
  //   }
  // }, [userId]);
  useEffect(() => {
  if (userId) {
    if (buyNowProduct) {
      // Buy Now flow: show only the selected product
      setProducts([buyNowProduct]);
      setLoading(false);
    } else {
      // Normal cart flow
      fetchCartItems();

      // Load saved checkout from localStorage only for cart items
      try {
        const saved = localStorage.getItem(`lafetch_checkout_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.selectedAddressId)
            setSelectedAddressId(parsed.selectedAddressId);
          if (parsed.orderTotal) setOrderTotal(parsed.orderTotal);
        }
      } catch (e) {}
    }

    // Always fetch addresses for both flows
    fetchAddresses();
  }
}, [userId, buyNowProduct]);

  

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await axiosHttp.get(`/cart-items/${userId}`);
      if (response.data.status === 200 && response.data.data) {
        const transformedData = response.data.data.map((item) => ({
          id: item.id,
          cartItemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.product.title,
          price: item.pricing?.unitPrice || item.product_variant.price, // Use unitPrice from pricing
          originalPrice:
            item.product.mrp ||
            item.product.basePrice ||
            item.product_variant.price, // MRP
          quantity: item.quantity || 1, // Use quantity directly from API
        }));

        // Filter products based on saved selection from localStorage
        // let selectedProducts = transformedData;
        // try {
        //   const saved = localStorage.getItem(`lafetch_checkout_${userId}`);
        //   if (saved) {
        //     const parsed = JSON.parse(saved);
        //     if (parsed.items && Array.isArray(parsed.items)) {
        //       const selectedCartItemIds = new Set(
        //         parsed.items
        //           .filter((item) => item.selected)
        //           .map((item) => item.cartItemId),
        //       );
        //       if (selectedCartItemIds.size > 0) {
        //         selectedProducts = transformedData.filter((p) =>
        //           selectedCartItemIds.has(p.cartItemId),
        //         );
        //       }
        //     }
        //   }
        // } catch (e) {}
        let selectedProducts;

        // 🔹 If Buy Now exists → ignore cart completely
        if (buyNowProduct) {
          selectedProducts = [buyNowProduct];
        } else {
          selectedProducts = transformedData;

          try {
            const saved = localStorage.getItem(`lafetch_checkout_${userId}`);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.items && Array.isArray(parsed.items)) {
                const selectedCartItemIds = new Set(
                  parsed.items
                    .filter((item) => item.selected)
                    .map((item) => item.cartItemId),
                );
                if (selectedCartItemIds.size > 0) {
                  selectedProducts = transformedData.filter((p) =>
                    selectedCartItemIds.has(p.cartItemId),
                  );
                }
              }
            }
          } catch (e) {}
        }

        setProducts(selectedProducts);

        // Keep Redux cart items in sync for selection state only
        try {
          const payload = transformedData.map((m) => ({
            ...m,
            cartItemId: m.cartItemId,
            variantId: m.variantId || null,
            selected:
              (
                cartItemsFromRedux.find(
                  (ci) => ci.cartItemId === m.cartItemId,
                ) || {}
              ).selected ?? true,
          }));
          dispatch(setCartItems(payload));
        } catch (e) {}
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axiosHttp.get(`/profile/addresses/${userId}`);
      if (response.data.status === 200 && response.data.data) {
        setAddresses(response.data.data);
        // Auto-select default address
        const defaultAddress = response.data.data.find(
          (addr) => addr.isDefaultAddress,
        );
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {}
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (addressId) => {
    setDeletingAddressId(addressId);
    setIsDeleteModalOpen(true);
  };

  const handleSaveAddress = async (formData) => {
    try {
      if (editingAddress) {
        // Update existing address
        const response = await axiosHttp.put(`/profile/address/`, {
          ...formData,
          addressId: editingAddress.id,
        });
        if (response.data.status === 200) {
          fetchAddresses();
          setIsAddressModalOpen(false);
        }
      } else {
        // Create new address
        const response = await axiosHttp.post(`/profile/address/`, formData);
        if (response.data.status === 200 || response.data.status === 201) {
          fetchAddresses();
          setIsAddressModalOpen(false);
        }
      }
    } catch (error) {
      toast.error("Failed to save address. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosHttp.delete(
        `/profile/address/${deletingAddressId}`,
      );
      if (response.data.status === 200) {
        fetchAddresses();
        setIsDeleteModalOpen(false);
        setDeletingAddressId(null);
        // If deleted address was selected, clear selection
        if (selectedAddressId === deletingAddressId) {
          setSelectedAddressId(null);
        }
      }
    } catch (error) {
      toast.error(
        "Failed to delete. This address is linked to an existing order.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!selectedAddressId) {
      toast.error("Please select an address to proceed.");
      return;
    }

    // Check if Razorpay is loaded
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    try {
      // Use already filtered products (only selected items from cart)
      if (products.length === 0) {
        toast.error("No items selected. Please select items to proceed.");
        return;
      }

      // Build items array for initiate-payment using selected products
      const items = products.map((item) => {
        const quantity = item.quantity || 1;
        const unitPrice = Number(item.price || 0);
        const itemTotal = unitPrice * quantity;

        return {
          productId: item.productId,
          variantId: item.variantId,
          quantity,
          unitPrice: unitPrice,
          discount: 0,
          total: itemTotal,
        };
      });

      // Calculate totals from selected products
      const totalMRP = products.reduce((s, it) => {
        const qty = it.quantity || 1;
        const mrp = Number(it.originalPrice || 0);
        return s + mrp * qty;
      }, 0);

      const subtotalBeforeCoupon = items.reduce(
        (s, it) => s + (it.total || 0),
        0,
      );

      // Calculate coupon discount
      let couponDiscount = 0;
      if (appliedCoupon && appliedCoupon.discountType) {
        const discountPercent = parseFloat(
          appliedCoupon.discountType.replace("%", ""),
        );
        const discountAmount = (subtotalBeforeCoupon * discountPercent) / 100;
        couponDiscount = Math.min(
          discountAmount,
          appliedCoupon.maxDiscountCap || discountAmount,
        );
      }

      const paymentTotal = subtotalBeforeCoupon - couponDiscount;

      // Step 2: Call /initiate-payment API
      const initiatePayload = {
        userId: userId,
        shippingAddressId: selectedAddressId,
        items: items,
        totalMRP: Number(totalMRP.toFixed(2)),
        couponDiscount: Number(couponDiscount.toFixed(2)),
        total: Number(paymentTotal.toFixed(2)),
        paymentMethod: "prepaid",
      };

      const initiateResp = await axiosHttp.post(
        `/initiate-payment`,
        initiatePayload,
      );

      if (
        !initiateResp.data ||
        (initiateResp.data.status !== 200 && initiateResp.data.status !== 201)
      ) {
        throw new Error(
          initiateResp.data?.message || "Failed to initiate payment",
        );
      }

      const { orderId, paymentId, providerOrderId } = initiateResp.data.data;

      if (!providerOrderId) {
        throw new Error("Provider order ID not received from server");
      }

      // Step 3: Store payment details in sessionStorage
      const paymentData = {
        orderId,
        paymentId,
        providerOrderId,
        selectedAddressId,
        items,
        total: +paymentTotal.toFixed(2),
        totalMRP,
        userId,
      };

      try { 
        sessionStorage.setItem(
          `lafetch_payment_${userId}`,
          JSON.stringify(paymentData),
        );
      } catch (e) {}

      // Step 4: Open Razorpay payment gateway
      const amountInPaise = Math.round(paymentTotal * 100);

      // Verify Razorpay key is available
      const razorpayKey = process.env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID;

      if (!razorpayKey) {
        toast.error("Payment configuration error. Please contact support.");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: amountInPaise,
        currency: "INR",
        name: "LaFetch",
        description: "Order Payment",
        image: "/logo.png",
        order_id: providerOrderId,
        prefill: {
          name: userInfo?.fullName || "",
          email: userInfo?.email || "",
          contact: userInfo?.phone || "",
        },
        notes: {
          address: "LaFetch order payment",
        },
        theme: { color: "#988BFF" },
        handler: async function (response) {
          try {
            // Validate Razorpay response
            if (!response.razorpay_payment_id) {
              throw new Error("Payment ID is missing from Razorpay response");
            }

            // Retrieve payment data from sessionStorage
            const storedData = sessionStorage.getItem(
              `lafetch_payment_${userId}`,
            );
            if (!storedData) {
              throw new Error("Payment data not found in storage");
            }

            const paymentInfo = JSON.parse(storedData);

            // Step 5: Call /place-order API with payment response
            const placeOrderPayload = {
              orderId: paymentInfo.orderId,
              paymentInfo: {
                providerOrderId:
                  response.razorpay_order_id || paymentInfo.providerOrderId,
                providerPaymentId: response.razorpay_payment_id,
                providerSignature: response.razorpay_signature || "",
              },
            };

            const placeResp = await axiosHttp.post(
              `/place-order`,
              placeOrderPayload,
            );

            if (
              placeResp.data &&
              (placeResp.data.status === 200 || placeResp.data.status === 201)
            ) {
              // TRIGGER PURCHASE EVENT HERE
              if (typeof window !== "undefined" && window.fbq && products?.length) {
                window.fbq('track', 'Purchase', {
                  content_ids: paymentInfo.items.map(i => i.productId.toString()),
                  content_type: 'product',
                   contents: paymentInfo.items.map(i => ({
                    id: i.productId.toString(),
                    quantity: i.quantity,
                    item_price: i.unitPrice
                  })),
                  value: Number(paymentInfo.total),
                  currency: 'INR',
                  num_items: paymentInfo.items.reduce((sum,i)=>sum+i.quantity,0),
                  transaction_id: response.razorpay_payment_id // Important for deduplication
                });
              }
              // Clear cart items from backend - delete only ordered items one by one
              try {
                // Use the items array that was sent in the order
                const orderedItems = items;

                // Delete each ordered item from cart sequentially
                for (const item of orderedItems) {
                  try {
                    await axiosHttp.delete(endPoints.deleteCartItem, {
                      data: {
                        userId: userId,
                        productId: item.productId,
                      },
                    });
                  } catch (deleteError) {}
                }
              } catch (e) {}

              // Clear Redux cart state - remove only ordered items
              const orderedProductIds = new Set(
                items.map((item) => item.productId),
              );
              const remainingItems = cartItemsFromRedux.filter(
                (item) => !orderedProductIds.has(item.productId),
              );
              dispatch(setCartItems(remainingItems));

              // Clear local state - remove only ordered items
              const remainingProducts = products.filter(
                (product) => !orderedProductIds.has(product.productId),
              );
              setProducts(remainingProducts);

              // Clear stored payment and checkout data
              try {
                sessionStorage.removeItem(`lafetch_payment_${userId}`);
                sessionStorage.removeItem(`lafetch_checkout_${userId}`);
                localStorage.removeItem(`lafetch_checkout_${userId}`);
              } catch (e) {}

              // Open payment confirmation modal with success
              setPaymentModalData({
                status: "success",
                transactionId: response.razorpay_payment_id,
                paymentMethod: "Razorpay",
                dateTime: new Date().toLocaleString(),
                amountPaid: paymentInfo?.total || paymentTotal || 0,
              });
              setIsPaymentModalOpen(true);
            } else {
              // Payment successful but order placement failed
              setPaymentModalData({
                status: "payment_success_order_failed",
                transactionId: response.razorpay_payment_id || "N/A",
                paymentMethod: "Razorpay",
                dateTime: new Date().toLocaleString(),
                amountPaid: paymentInfo?.total || paymentTotal || 0,
                errorMessage:
                  "Payment completed successfully but order could not be placed. Please contact support with your transaction ID.",
              });
              setIsPaymentModalOpen(true);
            }
          } catch (err) {
            // Payment successful but error occurred during order placement
            setPaymentModalData({
              status: "payment_success_order_failed",
              transactionId: response?.razorpay_payment_id || "N/A",
              paymentMethod: "Razorpay",
              dateTime: new Date().toLocaleString(),
              amountPaid: paymentTotal || 0,
              errorMessage:
                "Payment completed successfully but order could not be placed. Please contact support with your transaction ID.",
            });
            setIsPaymentModalOpen(true);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled. You can try again when ready.");
          },
        },
      };

      if (typeof window !== "undefined" && window.fbq) {
        window.fbq('track', 'AddPaymentInfo', {
          content_ids: products.map(p => p.productId.toString()),
           contents: products.map(p => ({
            id: p.productId.toString(),
            quantity: p.quantity || 1,
            item_price: p.price
          })),
          content_type: 'product',
          value: paymentTotal,
          currency: 'INR'
        });
      }

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        // Open failure modal with available details
        setPaymentModalData({
          status: "failed",
          transactionId: response.error?.code || "N/A",
          paymentMethod: "Razorpay",
          dateTime: new Date().toLocaleString(),
          amountPaid: 0,
        });
        setIsPaymentModalOpen(true);
      });

      rzp.open();
    } catch (err) {
      toast.error(
        "Could not start payment: " +
          (err.message || "Please try again later."),
      );
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-lg text-black">
        Loading your cart...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-[130px] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2 text-sm">
          <Link href="/checkout/bag" className="text-black">
            BAG
          </Link>
          <span className="text-black">--------</span>
          <Link
            href="/checkout/address"
            className="text-black underline decoration-[#988BFF] decoration-[2px] font-bold"
          >
            ADDRESS
          </Link>
          <span className="text-black">--------</span>
          <span className="text-black">PAYMENT</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Address Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  SELECT ADDRESS
                </h2>
                <p className="text-sm text-gray-600">
                  {addresses.length} Saved Address
                  {addresses.length !== 1 ? "es" : ""}
                </p>
              </div>
              <button
                onClick={handleAddNewAddress}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-black rounded hover:bg-gray-50 cursor-pointer"
              >
                <span className="text-xl">+</span>
                Add New Address
              </button>
            </div>

            {/* Default Address Section */}
            {addresses.filter((addr) => addr.isDefaultAddress).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  DEFAULT ADDRESS
                </h3>
                {addresses
                  .filter((addr) => addr.isDefaultAddress)
                  .map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      isSelected={selectedAddressId === address.id}
                      onSelect={() => setSelectedAddressId(address.id)}
                      onEdit={() => handleEditAddress(address)}
                      onDelete={() => handleDeleteAddress(address.id)}
                    />
                  ))}
              </div>
            )}

            {/* Other Addresses Section */}
            {addresses.filter((addr) => !addr.isDefaultAddress).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  OTHER ADDRESS
                </h3>
                {addresses
                  .filter((addr) => !addr.isDefaultAddress)
                  .map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      isSelected={selectedAddressId === address.id}
                      onSelect={() => setSelectedAddressId(address.id)}
                      onEdit={() => handleEditAddress(address)}
                      onDelete={() => handleDeleteAddress(address.id)}
                    />
                  ))}
              </div>
            )}

            {/* No Addresses Message */}
            {addresses.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">No saved addresses found</p>
                <button
                  onClick={handleAddNewAddress}
                  className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1 flex flex-col">
            <OrderSummary
              products={products}
              coupons={getCoupons}
              onAmountChange={(amount) => setOrderTotal(amount)}
            />

            {/* Proceed to Pay Button */}
            <button
              onClick={handleRazorpayPayment}
              disabled={!razorpayLoaded}
              className={`mt-6 w-full px-4 py-3 font-semibold rounded ${
                razorpayLoaded
                  ? "bg-black text-white cursor-pointer hover:bg-gray-800"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
            >
              {razorpayLoaded ? "Proceed to Pay" : "Loading Payment Gateway..."}
            </button>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editAddress={editingAddress}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAddressId(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      {/* Payment Confirmation Modal */}
      <PaymentStatusModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        status={paymentModalData.status}
        transactionId={paymentModalData.transactionId}
        paymentMethod={paymentModalData.paymentMethod}
        dateTime={paymentModalData.dateTime}
        amountPaid={paymentModalData.amountPaid}
        errorMessage={paymentModalData.errorMessage}
        onTrackOrder={() => {
          setIsPaymentModalOpen(false);
          router.push("/account/orders");
        }}
        onContinueShopping={() => {
          setIsPaymentModalOpen(false);
          router.push("/products");
        }}
      />
    </div>
  );
};

export default CheckOutAddress;
